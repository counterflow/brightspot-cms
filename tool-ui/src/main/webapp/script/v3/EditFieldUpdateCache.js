define(['jquery'], function($) {
    var viewerDataCache = { };
    var hitCount = 0;
    var missCount = 0;
    var fetchCount = 0;
    var putCount = 0;
    var cleanCallCount = 0;

    function debugViewersCache() {
        return window.LOG_VIEWERS_REPORTS && typeof console !== "undefined";
    }

    function report() {
        if (!debugViewersCache()) {
            return;
        }

        var total = hitCount + missCount,
            ratio = (total === 0 && hitCount === 0) ? 0.0 : (total === 0 ? 1.0 : (hitCount === 0 ? 0.0 : hitCount / total));

        ratio *= 100;

        console.log(
            "putCount: ", putCount,
            ", fetchCount: ", fetchCount,
            ", ratio: ", ratio + "%",
            "size: ", Object.keys(viewerDataCache).length
        );
    }

    // fetches data from cache
    function fetchData(contentId) {

        fetchCount += 1;

        report();

        return viewerDataCache[contentId];
    }

    return {

        putEmpty: function(key) {

            if (!viewerDataCache[key]) {

                if (debugViewersCache()) {
                    console.log("%cSEED", "color: green", key);
                }

                viewerDataCache[key] = [ ];
            }
        },

        put: function(data) {

            if (data && data.contentId) {

                // only cache data that's existed or been
                // pre-seeded to ensure that data in the
                // cache was intentionally placed there
                // starting with a restore
                if (viewerDataCache[data.contentId]) {

                    if (debugViewersCache()) {
                        console.log("PUT", data.contentId);
                    }

                    // caches the specified viewer data in the specified cache object,
                    // keyed by contentId then userId.
                    putCount += 1;

                    var contentId = data.contentId,
                            userId = data.userId,
                            contentData,
                            userDataIndex = undefined,
                            i;

                    contentData = viewerDataCache[contentId];

                    if (contentData === undefined) {
                        contentData = [ ];
                        viewerDataCache[contentId] = contentData;
                    }

                    for (i = 0; i < contentData.length; i += 1) {
                        if (contentData[i].userId === userId) {
                            userDataIndex = i;
                        }
                    }

                    if (userDataIndex !== undefined && userDataIndex >= 0) {
                        contentData.splice(userDataIndex, 1, data);
                    } else {
                        contentData.push(data);
                    }

                    report();

                } else {

                    if (debugViewersCache()) {
                        console.log("SKIP", data.contentId);
                    }
                }
            }
        },

        fetch: function(contentId) {

            var result = fetchData(contentId);

            if (result) {

                hitCount += 1;
                if (debugViewersCache()) {
                    console.log("%cCACHE HIT", "color: blue", contentId);
                }

            } else {

                missCount += 1;

                if (debugViewersCache()) {
                    console.log("%cCACHE MISS", "color: red", contentId);
                }
            }

            return result;
        },

        clearUnused: function() {

            cleanCallCount += 1;

            if (!(cleanCallCount % 20 === 0)) {
                return;
            }

            if (debugViewersCache()) {
                console.log("CLEAR");
            }

            // clean out unused cache entries before making call to restore
            var cleanCache = { };

            $('[data-rtc-content-id]').each(function() {
                var contentId = $(this).attr('data-rtc-content-id'),
                    cachedData = fetchData(contentId);

                if (cachedData) {
                    cleanCache[contentId] = cachedData;
                }
            });

            viewerDataCache = cleanCache;
        }
    };
});
