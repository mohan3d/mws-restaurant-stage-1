let restaurant;
var map;


document.addEventListener('DOMContentLoaded', (event) => {
  if (self.restaurant) {
    return;
  }

  fetchRestaurantFromURL()
  .then(restaurant => {
    self.restaurant = restaurant;
    if(!restaurant) return;
    
    return fetchRestaurantReviewsFromURL();
  })
  .then(reviews => {
    self.restaurant.reviews = reviews;

    fillRestaurantHTML();
    fillRestaurantMapImage();
    fillBreadcrumb();
    LazyLoad();
  })
  .catch(err => console.error(err));
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });

  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {  
  const id = getParameterByName('id');
  return DBHelper.fetchRestaurantById(id);
}

/**
 * Get all reviews of the restaurant.
 */
fetchRestaurantReviewsFromURL = () => {
  const id = getParameterByName('id');
  return DBHelper.fetchRestaurantReviewsById(id);
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img lazy';
  // image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = image.alt = `An image from the restaurant ${restaurant.name}`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create 5-star rating.
 */
createReviewRatingHTML = (review) => {
  const reviewRating = review.rating;
  
  const rating = document.createElement('p');
  rating.innerHTML = 'Rating: ';
  rating.className = 'rating-stars';

  for (let i = 1; i <= 5; i++) {
    const span = document.createElement('span');
    span.className = (i <= reviewRating ? 'fa fa-star checked' : 'fa fa-star');
    rating.appendChild(span);
  }

  return rating;
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = (review.createdAt ? DBHelper.dateFormat(review.createdAt) : 'Offline review');
  li.appendChild(date);

  const rating = createReviewRatingHTML(review);
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  
  const a = document.createElement('a');
  a.setAttribute('aria-current', 'page');
  a.setAttribute('href', '#');
  a.innerHTML = restaurant.name;

  const li = document.createElement('li');
  li.appendChild(a);

  breadcrumb.appendChild(li);
}

/**
 * Submit review to backend.
 */
addReview = () => {
  const reviewForm = document.getElementById('review-form');
  
  if(!reviewForm.name.value){
    displayMessage('Please enter your name before submitting.');
    return;
  }

  const restaurantID = getParameterByName('id');
  const data = {
    "restaurant_id": restaurantID,
    "name": reviewForm.name.value,
    "rating": reviewForm.rating.value,
    "comments": reviewForm.comments.value,    
  }

  if(navigator.onLine) {
    DBHelper.submitReview(data)
    .then(resp => {
      fillReviewsHTML([data]);
      displayMessage('Your review has been submitted successfully.');
      reviewForm.reset();  
    })
    .catch(err => console.error(err));
  } else {
    DBHelper.storeOfflineReview(data)
    .then(review => {
      fillReviewsHTML([review]);
      displayMessage('You are offline, your review has been saved.');
      reviewForm.reset(); 
    })
    .catch(err => console.error(err));
  }  
}

/**
 * Fill map placeholder with image map.
 */
fillRestaurantMapImage = (restaurant=self.restaurant) => {
  const image = document.getElementById('map-image');
  // image.src = DBHelper.imageUrlForRestaurantMap(restaurant);
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurantMap(restaurant));
}

/**
 * Update previously deferred reviews.
 */
updateDeferredReviews = () => {
  DBHelper.updateAndDeleteDeferredReviews();
}

/**
 * Display the message in a snackbar.
 */
displayMessage = (message, duration=5000) => {
  const snackbar = document.getElementById('snackbar');
  snackbar.className = "show";
  snackbar.innerHTML = message;  

  setTimeout(() => { 
    snackbar.className = snackbar.className.replace("show", ""); 
  }, duration);
}

/**
 * Add google map.
 */
addMap = () => {
  const map = document.createElement('script');
  map.src = DBHelper.GOOGLE_MAP_URL;
  document.body.appendChild(map);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

window.addEventListener('online', () => {
  updateDeferredReviews();
});

window.addEventListener('DOMContentLoaded', () => {
  if(navigator.onLine) { 
    updateDeferredReviews();
  }
});


/**
 * Lazy load images with intersection detection.
 */
LazyLoad = () => {
  var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

  let lazyImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        let lazyImage = entry.target;
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.classList.remove("lazy");
        lazyImageObserver.unobserve(lazyImage);
      }
    });
  });

  lazyImages.forEach(function(lazyImage) {
    lazyImageObserver.observe(lazyImage);
  });
}