const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp(functions.config().firebase);
const database = admin.database();

/**
 * Return list of not-null values.
 */
function notNullValues(lst) {
  return lst.filter(v => v !== null);
}

/**
 * Extract restaurant ID from path.
 */
function getRestaurantID(path){
  return path ? path.split('/')[1] : null;
}

/**
 * Return list of all restaurants.
 */
function handleRestaurants(req, res) {
  const restaurantsPromise = database.ref('restaurants/').once('value');

  restaurantsPromise.then(snapshot => {
    const restaurants = snapshot.val();
    res.json(notNullValues(restaurants));
  });
}

/**
 * Return restaurant data by ID.
 */
function handleRestaurant(restaurantID, req, res) {
  const restaurantPromise = database.ref(`restaurants/${restaurantID}`).once('value');

  restaurantPromise.then(snapshot => {
    const restaurant = snapshot.val();
    res.json(restaurant);
  });
}

/**
 * Update is_favorite value for a restaurant by ID.
 */
function handleFavoriteRestaurant(restaurantID, req, res) {
  const is_favorite = req.query.is_favorite;
  const restaurantRef = database.ref(`restaurants/${restaurantID}`);

  restaurantRef.update({ is_favorite })
  .then(resp => restaurantRef.once('value'))
  .then(snapshot => {
    const restaurant = snapshot.val();
    res.json(restaurant);
  })
  .catch(err => res.status(404).send({ 'error': JSON.parse(err) }));
}

/**
 * Handle requests for restaurant.
 * GET with no restaurantID - all restaurants.
 * GET with restaurantID - a specific restaurant.
 * PUT with restaurantID and is_favorite value - updates is_favorite value for the restaurant.
 */
exports.restaurants = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    const restaurantID = getRestaurantID(req.path);

    switch(req.method) {
      case 'GET':
        if(restaurantID) handleRestaurant(restaurantID, req, res);
        else handleRestaurants(req, res);
        break;
      case 'PUT':
        handleFavoriteRestaurant(restaurantID, req, res);
        break;
      default:
        res.status(405).send({ error: 'unknown method.' });
        break;
    }
  });  
});

/**
 * Return list of all reviews for a specific restaurant.
 */
function handleReviews(req, res) {
  const restaurantID = req.query.restaurant_id;
  const reviewsPromise = database.ref(`reviews/${restaurantID}`).once('value');

  reviewsPromise.then(snapshot => {
    const reviews = snapshot.val();
    res.json(Object.keys(reviews).map(key => reviews[key]));
  });
}

/**
 * Creates new review for a specific restaurant.
 */
function handleCreateReview(req, res) {
  const restaurant_id = req.body.restaurant_id;
  const name = req.body.name;
  const rating = req.body.rating;
  const comments = req.body.comments || '';
  const createdAt = req.body.createdAt || Date.now();
  const updatedAt = req.body.updatedAt || createdAt;
  const review = { name, rating, comments, createdAt, updatedAt, restaurant_id };
  
  const reviewsListRef = database.ref(`reviews/${restaurant_id}`);
  
  reviewsListRef.push(review)
  .then(resp => res.json(review))
  .catch(err => res.status(404).send({ 'error': JSON.parse(err) }));
}

/**
 * Handle requests for reviews.
 * GET  - get all reviews.
 * POST - creates new review.
 */
exports.reviews = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    switch(req.method) {
      case 'GET':
        handleReviews(req, res);
        break;
      case 'POST':
        handleCreateReview(req, res);
        break;
      default:
        res.status(405).send({ error: 'unknown method.' });
        break;
    }
  });
});