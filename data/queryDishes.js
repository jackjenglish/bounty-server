import client from '../mongo';
import keyBy from 'lodash/keyBy';
import moment from 'moment';

const allergensQueryComponent = allergens => ({
  ingredients: {
    $not: {
      $elemMatch: {
        group: {
          $not: {
            $elemMatch: {
              allergens: {
                $not: {
                  $in: allergens
                }
              }
            }
          }
        }
      }
    }
  }
});

const mapDietToAllerens = (dietList) => {
  const map = {
    'vegetarian': 'meat',
    'vegan': 'animal-products',
    'dairy-free': 'dairy',
    'gluten-free': 'gluten',
    'alcohol-free': 'alcohol'
  };
  return dietList.map(diet => map[diet]);
};

const convertDietToAllergens = (sections) => {
  // Diet Edge Case
  const sectionsByName = keyBy(sections, 'name');
  const dietSection = sectionsByName['diet'];
  const allergenSection = sectionsByName['allergens'];
  if (dietSection && dietSection.selected.length > 0) {
    const equivalentAllergens = mapDietToAllerens(dietSection.selected);
    equivalentAllergens.forEach((allergen) => {
      if (allergenSection.selected.indexOf(allergen) === -1) {
        allergenSection.selected.push(allergen);
      }
    });
  }
};

const constructQuery = (searchValue, filterData) => {
  let query = {};

  query.published = true;
  
  if (searchValue && searchValue.length > 0) {
    query.title = new RegExp(`.*${searchValue}.*`, 'i');
  }

  if (!filterData) return query;
  const { sections, cookingTime, price, ingredients, currentlyAvailable } = filterData;

  if (ingredients && ingredients.length > 0) {
    query['ingredients.group.value'] = {
      $all: ingredients
    };
  }

  if (filterData.dishType) {
    // query.isSpecial = true;

    if (filterData.dishType === 'special' || filterData.dishType === 'deal') {
      query.dishType = filterData.dishType;
      const timeAvailable = filterData.specialsTimeAvailability; 
      query.timeAvailable = timeAvailable;
    }
  }

  // Diet Values Edge Case. Must be converted to appropriate allergens to exclude.
  // Will add to allergens list.
  convertDietToAllergens(sections);


  sections.forEach((section) => {
    switch (section.name) {
      case 'tags': {
        if (section.selected.length === 0) break;
        query = { ...query, ...{ tags: { $in: section.selected } } };
        break;
      }
      case 'category': {
        if (section.selected.length === 0) break;
        query = { ...query, ...{ categories: { $in: section.selected } } };
        break;
      }
      case 'allergens': {
        query = { ...query, ...allergensQueryComponent(section.selected) };
        break;
      }
      default: { break; }
    }
  });
 
  /*query.$or = [ 
    { cookingTime: { $gte: cookingTime.lower, $lte: cookingTime.upper } }, 
    { cookingTime: null }  
  ];*/
  query.$and = [
    { $or: [
      { cookingTime: { $gte: cookingTime.lower, $lte: cookingTime.upper } }, 
      { cookingTime: null }  
    ] },
  ];

  if (true) {
    const currentTime = moment().format('HH:mm');
    console.log('currently Available', currentTime);

    /* 

    SELECT *, <output array field>
    FROM collection
    WHERE <output array field> IN (SELECT *
                                  FROM <collection to join>
                                  WHERE <foreignField>= <collection.localField>);
                              
      {
        $lookup:
          {
            from: <collection to join>,
            localField: <field from the input documents>,
            foreignField: <field from the documents of the "from" collection>,
            as: <output array field>
          }
      }
    
    query.$and.push(
      { $or: [
        $and: [
          { "availableBetween.start": { $lte: currentTime } }, 
          { "availableBetween.end": { $gte: currentTime } }, 
        ]
        { availableBetween: null }  
      ] },
    );*/
  }
  
  query.price = { $gte: price.lower, $lte: price.upper };

  return query;
};

export default function queryDishes(searchValue, filterData) {
  return new Promise((resolve, reject) => {
    if (client.isConnected()) {
      const collection = client.db('peckish').collection('dishes');

      const query = constructQuery(searchValue, filterData);
      console.log('query\n', JSON.stringify(constructQuery(searchValue, filterData)));
    
      const cursor = collection.find(query);

      // return results
      cursor.toArray((err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
    } else {
      return reject('Client Not Connected');
    }
  });
}
