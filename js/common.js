/**
 * Lazy load images with intersection detection.
 */
LazyLoad = () => {
    var lazyImages = [].slice.call(document.querySelectorAll("img.lazy"));

    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
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
  
/**
* Add google map.
*/
addMap = () => {
    const map = document.createElement('script');
    map.src = DBHelper.GOOGLE_MAP_URL;
    document.body.appendChild(map);
}