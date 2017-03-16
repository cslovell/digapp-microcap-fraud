/*
 * Copyright 2017 Next Century Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* exported docTransform */
/* jshint camelcase:false */

var docTransform = (function(_, commonTransforms) {

  function getDataFromRecord(record, path) {
    var strict = _.get(record, path + '.strict', []);
    var strictKeys = strict.map(function(item) {
      return item.key;
    });

    // Relaxed is a superset of strict.  Remove all items from relaxed that exist in strict for this use case.
    var relaxed = _.get(record, path + '.relaxed', []).filter(function(item) {
      return strictKeys.indexOf(item.key) < 0;
    });

    // TODO Ignore relaxed for now.
    relaxed = [];

    return {
      relaxed: relaxed,
      strict: strict
    };
  }

  function getSingleItemFromRecord(record, path) {
    var items = getDataFromRecord(record, path);
    return items.strict.length ? items.strict.map(function(item) {
      return item.name;
    }).join('\n') : (items.relaxed.length ? items.relaxed.map(function(item) {
      return item.name;
    }).join('\n') : undefined);
  }

  function getDate(record, path) {
    var date = getSingleItemFromRecord(record, path);
    return commonTransforms.getDate(date) || 'No Date';
  }

  function getDataOfTypeFromList(list, type, confidence) {
    return list.map(function(item) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      var count = item.doc_count;
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
      return {
        confidence: confidence,
        count: count,
        id: item.key,
        icon: commonTransforms.getIronIcon(type),
        link: commonTransforms.getLink(item.key, type),
        styleClass: commonTransforms.getStyleClass(type),
        text: item.name || item.key,
        type: type
      };
    });
  }

  function getDataOfTypeFromRecord(record, path, type) {
    var data = getDataFromRecord(record, path);
    return getDataOfTypeFromList(data.strict, type, 'strict').concat(getDataOfTypeFromList(data.relaxed, type, 'relaxed'));
  }

  function getHighlightedText(record, path1, path2) {
    if(record.highlight) {
      if(record.highlight[path1] && record.highlight[path1].length && record.highlight[path1][0]) {
        return record.highlight[path1][0];
      }
      if(record.highlight[path2] && record.highlight[path2].length && record.highlight[path2][0]) {
        return record.highlight[path2][0];
      }
    }
    return undefined;
  }

  function addHighlights(data, record, paths) {
    if(record.highlight) {
      var cleanHighlight = function(text, path) {
        return text.indexOf('<em>') >= 0 ? text.replace(/\<\/?em\>/g, '').toLowerCase() : '';
      };

      var highlights = {};

      paths.forEach(function(path) {
        if(record.highlight[path] && record.highlight[path].length) {
          record.highlight[path].forEach(function(highlight) {
            var cleanedHighlight = cleanHighlight(highlight, path);
            if(cleanedHighlight) {
              highlights[cleanedHighlight] = true;
            }
          });
        }
      });

      _.keys(highlights).forEach(function(highlight) {
        data.forEach(function(item) {
          if(item.id && ('' + item.id).toLowerCase().indexOf(highlight) >= 0) {
            item.highlight = true;
          }
        });
      });
    }
    return data;
  }

  function getDocObject(record) {
    var id = _.get(record, '_id');
    var url = _.get(record, '_source.url');

    if(!id || !url) {
      return {};
    }

    var rank = _.get(record, '_score');
    //var domain = _.get(record, '_source.tld');

    var doc = {
      id: id,
      url: url,
      rank: rank ? rank.toFixed(2) : rank,
      type: 'doc',
      icon: commonTransforms.getIronIcon('doc'),
      link: commonTransforms.getLink(id, 'doc'),
      styleClass: commonTransforms.getStyleClass('doc'),
      title: getSingleItemFromRecord(record, '_source.fields.title') || 'No Title',
      content: getSingleItemFromRecord(record, '_source.fields.content') || 'No Content',
      locations: getDataOfTypeFromRecord(record, '_source.fields.location', 'location'),
      moneys: getDataOfTypeFromRecord(record, '_source.fields.money', 'money'),
      orgs: getDataOfTypeFromRecord(record, '_source.fields.org', 'org'),
      persons: getDataOfTypeFromRecord(record, '_source.fields.person', 'person'),
      products: getDataOfTypeFromRecord(record, '_source.fields.product', 'product'),
      tickers: getDataOfTypeFromRecord(record, '_source.fields.ticker', 'ticker'),
      /*
      domain: domain || 'No Domain',
      disclaimers: getSingleItemFromRecord(record, '_source.fields.disclaimer') || 'No Disclaimer',
      tickerSymbols: getDataOfTypeFromRecord(record, '_source.fields.ticker_symbol', 'ticker_symbol'),
      postTypes: getDataOfTypeFromRecord(record, '_source.fields.type', 'post_type'),
      postIds: getDataOfTypeFromRecord(record, '_source.fields.post_id', 'post_id'),
      authors: getDataOfTypeFromRecord(record, '_source.fields.author', 'author'),
      authorProfiles: getDataOfTypeFromRecord(record, '_source.fields.author_profile', 'author_profile'),
      companies: getDataOfTypeFromRecord(record, '_source.fields.company', 'company'),
      companyTypes: getDataOfTypeFromRecord(record, '_source.fields.company_type', 'company_type'),
      forumNames: getDataOfTypeFromRecord(record, '_source.fields.forum_name', 'forum_name'),
      ages: getDataOfTypeFromRecord(record, '_source.fields.age', 'age'),
      followedBy: getDataOfTypeFromRecord(record, '_source.fields.followed_by', 'followed_by'),
      locations: getDataOfTypeFromRecord(record, '_source.fields.location', 'location'),
      numberOfPosts: getDataOfTypeFromRecord(record, '_source.fields.num_posts', 'number_of_posts'),
      stocksOwned: getDataOfTypeFromRecord(record, '_source.fields.stocks_owned', 'stocks_owned'),
      moderators: getDataOfTypeFromRecord(record, '_source.fields.moderator', 'moderator'),
      websites: getDataOfTypeFromList([{
        key: domain
      }], 'website'),
      date: {
        icon: commonTransforms.getIronIcon('date'),
        styleClass: commonTransforms.getStyleClass('date'),
        text: getDate(record, '_source.fields.posting_date'),
        type: 'date'
      },
      dateProfileCreated: {
        icon: commonTransforms.getIronIcon('creation_date'),
        styleClass: commonTransforms.getStyleClass('creation_date'),
        text: getDate(record, '_source.fields.date_profile_created'),
        type: 'creation_date'
      },
      */
      highlightedText: getHighlightedText(record, 'fields.title.strict.name', 'fields.title.relaxed.name'),
      descriptors: [],
      details: []
    };

    doc.locations = addHighlights(doc.locations, record, ['fields.location.strict.name']);
    doc.moneys = addHighlights(doc.moneys, record, ['fields.money.strict.name']);
    doc.orgs = addHighlights(doc.orgs, record, ['fields.org.strict.name']);
    doc.persons = addHighlights(doc.persons, record, ['fields.person.strict.name']);
    doc.products = addHighlights(doc.products, record, ['fields.product.strict.name']);
    doc.tickers = addHighlights(doc.tickers, record, ['fields.ticker.strict.name']);

    /*
    doc.tickerSymbols = addHighlights(doc.tickerSymbols, record, ['fields.ticker_symbol.strict.name']);
    doc.postTypes = addHighlights(doc.postTypes, record, ['fields.type.strict.name']);
    doc.postIds = addHighlights(doc.postIds, record, ['fields.post_id.strict.name']);
    doc.authors = addHighlights(doc.authors, record, ['fields.author.strict.name']);
    doc.authorProfiles = addHighlights(doc.authorProfiles, record, ['fields.author_profile.strict.name']);
    doc.companies = addHighlights(doc.companyTypes, record, ['fields.company.strict.name']);
    doc.companyTypes = addHighlights(doc.companyTypes, record, ['fields.company_type.strict.name']);
    doc.forumNames = addHighlights(doc.forumNames, record, ['fields.forum_name.strict.name']);
    doc.ages = addHighlights(doc.ages, record, ['fields.age.strict.name']);
    doc.followedBy = addHighlights(doc.followedBy, record, ['fields.followed_by.strict.name']);
    doc.locations = addHighlights(doc.locations, record, ['fields.location.strict.name']);
    doc.numberOfPosts = addHighlights(doc.numberOfPosts, record, ['fields.num_posts.strict.name']);
    doc.stocksOwned = addHighlights(doc.stocksOwned, record, ['fields.stocks_owned.strict.name']);
    doc.moderators = addHighlights(doc.moderators, record, ['fields.moderator.strict.name']);
    */

    doc.descriptors.push({
      name: 'Tickers',
      data: doc.tickers
    });
    doc.descriptors.push({
      name: 'Products',
      data: doc.products
    });
    doc.descriptors.push({
      name: 'People',
      data: doc.persons
    });
    doc.descriptors.push({
      name: 'Organizations',
      data: doc.orgs
    });
    doc.descriptors.push({
      name: 'Money',
      data: doc.moneys
    });
    doc.descriptors.push({
      name: 'Locations',
      data: doc.locations
    });

    /*
    doc.descriptors.push({
      name: 'Ticker Symbols',
      data: doc.tickerSymbols
    });
    doc.descriptors.push({
      name: 'Post Types',
      data: doc.postTypes
    });
    doc.descriptors.push({
      name: 'Authors',
      data: doc.authors
    });
    doc.descriptors.push({
      name: 'Forum Names',
      data: doc.forumNames
    });
    doc.descriptors.push({
      name: 'Companies',
      data: doc.companies
    });
    doc.descriptors.push({
      name: 'Company Types',
      data: doc.companyTypes
    });
    doc.descriptors.push({
      name: 'Post Date',
      data: [doc.date]
    });
    doc.descriptors.push({
      name: 'Profile Creation Date',
      data: [doc.dateProfileCreated]
    });
    doc.descriptors.push({
      name: 'Locations',
      data: doc.locations
    });
    doc.descriptors.push({
      name: 'Websites',
      data: doc.websites
    });
    doc.descriptors.push({
      name: 'Author Profiles',
      data: doc.authorProfiles
    });
    doc.descriptors.push({
      name: 'Ages',
      data: doc.ages
    });
    doc.descriptors.push({
      name: 'Followed By',
      data: doc.followedBy
    });
    doc.descriptors.push({
      name: 'Moderators',
      data: doc.moderators
    });
    doc.descriptors.push({
      name: 'Stocks Owned',
      data: doc.stocksOwned
    });
    doc.descriptors.push({
      name: 'Number of Posts',
      data: doc.numberOfPosts
    });
    doc.descriptors.push({
      name: 'Post IDs',
      data: doc.postIds
    });
    */

    doc.details.push({
      name: 'Url',
      link: url || null,
      text: url || 'Unavailable'
    });
    doc.details.push({
      name: 'Content',
      highlightedText: getHighlightedText(record, 'fields.content.strict.name', 'fields.content.relaxed.name'),
      text: doc.content
    });
    /*
    doc.details.push({
      name: 'Disclaimers',
      highlightedText: getHighlightedText(record, 'fields.disclaimer.strict.name', 'fields.disclaimer.relaxed.name'),
      text: doc.disclaimers
    });
    */
    doc.details.push({
      name: 'Cached Webpage',
      link: id ? commonTransforms.getLink(id, 'cache') : null,
      text: id ? 'Open' : 'Unavailable'
    });

    return doc;
  }

  function offsetDatesInObjects(dateObjects) {
    var sorted = _.sortBy(dateObjects, [function(o) { return o.date; }]);
    for(var i = 1; i < sorted.length; i++) {
      if(sorted[i] === sorted[i - 1]) {
        sorted[i] = {
          count: sorted[i].count,
          date: new Date(sorted[i].date.getTime() + 300)
        };
      }
    }

    return sorted;
  }

  function createLocationTimelineNotes(bucket) {
    var notes = [];

    if(bucket.publishers) {
      var publishers = getPublishersFromList(bucket.publishers.buckets);
      if(publishers.length) {
        notes.push({
          name: 'Websites',
          data: publishers
        });
      }
    }

    if(bucket.phones) {
      var phones = getPhonesFromList(bucket.phones.buckets);
      if(phones.length) {
        notes.push({
          name: 'Telephone Numbers',
          data: phones
        });
      }
    }

    if(bucket.emails) {
      var emails = getEmailsFromList(bucket.emails.buckets);
      if(emails.length) {
        notes.push({
          name: 'Email Addresses',
          data: emails
        });
      }
    }

    return notes;
  }

  /**
   * Returns a location timeline represented by a list of objects containing the dates, locations present on each date,
   * and notes for each location.
   * [{
   *     date: 1455657767,
   *     subtitle: "Mountain View, CA",
   *     locations: [{
   *         name: "Mountain View, CA, USA",
   *         type: "location",
   *         count: 12,
   *         notes: [{
   *             name: "Email Address",
   *             data: [{
   *                 id: "http://email/abc@xyz.com",
   *                 link: "/email.html?value=http://email/abc@xyz.com&field=_id",
   *                 text: "abc@xyz.com",
   *                 type: "email"
   *             }]
   *         }, {
   *             name: "Telephone Number",
   *             data: [{
   *                 id: "http://phone/1234567890",
   *                 link: "/phone.html?value=http://phone/1234567890&field=_id",
   *                 text: "1234567890",
   *                 type: "phone"
   *             }, {
   *                 id: "http://phone/0987654321",
   *                 link: "/phone.html?value=http://phone/0987654321&field=_id",
   *                 text: "0987654321",
   *                 type: "phone"
   *             }]
   *         }, {
   *             name: "Website",
   *             data: [{
   *                 text: "google.com",
   *                 type: "webpage"
   *             }]
   *         }]
   *     }]
   * }]
   */
  function createLocationTimeline(buckets, onlyId) {
    var timeline = _.reduce(buckets, function(timeline, bucket) {
      /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
      if(bucket.doc_count) {
        var dateBucket = {
          date: commonTransforms.getDate(bucket.key),
          icon: commonTransforms.getIronIcon('date'),
          styleClass: commonTransforms.getStyleClass('date')
        };

        var sum = 0;
        var subtitle = [];

        dateBucket.locations = bucket.locations.buckets.map(function(locationBucket) {
          sum += locationBucket.doc_count;
          var locationObject = getUniqueLocation(locationBucket);
          if(locationObject.textAndCount) {
            subtitle.push({
              id: locationObject.id,
              text: locationObject.textAndCount
            });
          }
          locationObject.notes = createLocationTimelineNotes(locationBucket);
          return locationObject;
        }).filter(function(location) {
          return location.latitude && location.longitude && location.text;
        });

        if(sum < bucket.doc_count) {
          var count = bucket.doc_count - sum;
          var text = 'Unknown Location(s)';
          var textAndCount = text + ' (' + (count) + ')';
          subtitle.push({
            text: textAndCount
          });
          dateBucket.locations.push({
            count: count,
            icon: commonTransforms.getIronIcon('location'),
            styleClass: commonTransforms.getStyleClass('location'),
            text: text,
            textAndCount: textAndCount,
            type: 'location',
            notes: []
          });
        }

        if(onlyId) {
          dateBucket.locations = dateBucket.locations.filter(function(locationObject) {
            return locationObject.id === onlyId;
          });

          subtitle = subtitle.filter(function(item) {
            return item.id === onlyId;
          });

          if(!dateBucket.locations.length) {
            return;
          }
        }

        dateBucket.subtitle = subtitle[0].text + (subtitle.length > 1 ? (' and ' + (subtitle.length - 1) + ' more') : '');
        timeline.push(dateBucket);
      }
      /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

      return timeline;
    }, []);

    // Sort oldest first.
    timeline.sort(function(a, b) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return timeline;
  }

  function getTitle(length, name, sayOther, suffix) {
    return (length || 'No') + (sayOther ? ' Other ' : ' ') + name + (length === 1 ? '' : (suffix || 's'));
  }

  return {
    doc: function(data) {
      if(data && data.hits.hits.length > 0) {
        return getDocObject(data.hits.hits[0]);
      }
      return {};
    },

    docs: function(data) {
      var docs = {
        data: [],
        count: 0
      };
      if(data && data.hits.hits.length) {
        docs.data = data.hits.hits.map(function(record) {
          return getDocObject(record);
        });
        docs.count = data.hits.total;
      }
      return docs;
    },

    removeDescriptorFromOffers: function(descriptorId, offers) {
      var filterFunction = function(descriptor) {
        return descriptor.id !== descriptorId;
      };

      return offers.map(function(offer) {
        offer.emails = offer.emails.filter(filterFunction);
        offer.phones = offer.phones.filter(filterFunction);
        offer.prices = offer.prices.filter(filterFunction);
        offer.locations = offer.locations.filter(filterFunction);
        return offer;
      });
    },

    removeNoteFromLocationTimeline: function(noteItemId, oldTimeline) {
      var newTimeline = oldTimeline.map(function(date) {
        date.locations = date.locations.map(function(location) {
          location.notes = location.notes.map(function(note) {
            var previousLength = note.data.length;
            note.data = note.data.filter(function(item) {
              return item.id !== noteItemId;
            });
            if(note.data.length < previousLength) {
              note.name = 'Other ' + note.name;
            }
            return note;
          });
          // Remove any notes that no longer have any data.
          location.notes = location.notes.filter(function(note) {
            return note.data.length;
          });
          return location;
        });
        return date;
      });

      // Sort newest first.
      newTimeline.sort(function(a, b) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      return newTimeline;
    },

    locationTimeline: function(data, onlyId) {
      return {
        dates: (data && data.aggregations) ? createLocationTimeline(data.aggregations.dates.dates.buckets, onlyId) : undefined
      };
    },

    createEventDropsTimeline: function(data, locationId) {
      var locations = [];
      var dates = [];
      var locationIdToDates = {};

      if(data && data.aggregations) {
        data.aggregations.locations.locations.buckets.forEach(function(locationBucket) {
          var city = locationBucket.key;

          locationIdToDates[city] = locationIdToDates[city] || [];

          locationBucket.dates.buckets.forEach(function(dateBucket) {
            /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
            if(dateBucket.key && dateBucket.doc_count > 0) {
              locationIdToDates[city].push({
                date: new Date(dateBucket.key),
                count: dateBucket.doc_count
              });
              if(!locationId || locationId === city) {
                dates.push(dateBucket.key);
              }
            }
            /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
          });
        });
      }

      _.keys(locationIdToDates).forEach(function(city) {
        var locationDates = offsetDatesInObjects(locationIdToDates[city]);

        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var location = getUniqueLocation({
          doc_count: locationIdToDates[city].reduce(function(count, dateObject) {
            return count + dateObject.count;
          }, 0),
          key: city
        });
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

        if(location.latitude && location.longitude && location.text) {
          location.name = location.text;
          location.dates = locationDates.map(function(dateObject) {
            return {
              count: dateObject.count,
              date: dateObject.date,
              name: location.name
            };
          });

          locations.push(location);
        }
      });

      var locationWithId = !locationId ? locations : locations.filter(function(location) {
        return location.id === locationId;
      });

      var otherLocations = !locationId ? locations : locations.filter(function(location) {
        return location.id !== locationId;
      });

      return {
        dates: dates,
        locations: locationWithId,
        allLocations: locations,
        otherLocations: otherLocations
      };
    },

    offerPhones: function(data, ignoreId) {
      var phones = [];
      var sayOther = false;
      if(data && data.aggregations && data.aggregations.phone && data.aggregations.phone.phone) {
        phones = getPhonesFromList(data.aggregations.phone.phone.buckets || []).filter(function(phone) {
          var result = ignoreId ? phone.id !== ignoreId : true;
          sayOther = sayOther || !result;
          return result;
        });
      }
      return {
        title: getTitle(phones.length, 'Telephone Number', sayOther),
        phone: phones
      };
    },

    offerEmails: function(data, ignoreId) {
      var emails = [];
      var sayOther = false;
      if(data && data.aggregations && data.aggregations.email && data.aggregations.email.email) {
        emails = getEmailsFromList(data.aggregations.email.email.buckets || []).filter(function(email) {
          var result = ignoreId ? email.id !== ignoreId : true;
          sayOther = sayOther || !result;
          return result;
        });
      }
      return {
        title: getTitle(emails.length, 'Email Address', sayOther, 'es'),
        email: emails
      };
    },

    offerLocationsTitle: function(data) {
      return getTitle(data.length, 'Location');
    },

    offerLocations: function(data) {
      var locations = [];
      if(data && data.aggregations && data.aggregations.location && data.aggregations.location.location) {
        locations = getUniqueLocationsFromList(data.aggregations.location.location.buckets || []);
      }
      return {
        title: getTitle(locations.length, 'Location'),
        location: locations
      };
    },

    offerProviderAttributes: function(data) {
      var attributes = [];
      if(data && data.aggregations && data.aggregations.attribute && data.aggregations.attribute.attribute) {
        attributes = getProviderAttributesFromList(data.aggregations.attribute.attribute.buckets || []);
      }
      return {
        attribute: attributes
      };
    },

    offerPublishers: function(data) {
      var publishers = [];
      if(data && data.aggregations && data.aggregations.publisher && data.aggregations.publisher.publisher) {
        publishers = getPublishersFromList(data.aggregations.publisher.publisher.buckets || []);
      }
      return {
        title: getTitle(publishers.length, 'Website'),
        publisher: publishers
      };
    },

    offerReviewIds: function(data) {
      var reviewIds = [];
      if(data && data.aggregations && data.aggregations.review && data.aggregations.review.review) {
        reviewIds = getReviewIdsFromList(data.aggregations.review.review.buckets || []);
      }
      return {
        title: getTitle(reviewIds.length, 'Review ID'),
        review: reviewIds
      };
    },

    offerSocialIds: function(data) {
      var socialIds = [];
      if(data && data.aggregations && data.aggregations.social && data.aggregations.social.social) {
        socialIds = getSocialIdsFromList(data.aggregations.social.social.buckets || []);
      }
      return {
        title: getTitle(socialIds.length, 'Social Media ID'),
        social: socialIds
      };
    },

    locationPageMap: function(locationId, data) {
      if(!locationId || !data || !data.length) {
        // need to return undefined here so that we wait until all data is ready before displaying points on the map
        return undefined;
      }

      return data.map(function(location) {
        if(location.id === locationId) {
          location.iconId = 'mainLocation';
        }
        return location;
      });
    },

    createExportDataForCsv: function(results) {
      /*
      var linkPrefix = window.location.hostname + ':' + window.location.port;
      var data = [[
        'ad url',
        'dig url',
        'title',
        'high risk',
        'date',
        'locations',
        'telephone numbers',
        'email addresses',
        'social media ids',
        'review ids',
        'images',
        'description'
      ]];
      results.forEach(function(result) {
        var locations = result.locations.map(function(location) {
          return location.textAndCountry;
        }).join('; ');
        var phones = result.phones.map(function(phone) {
          return phone.text;
        }).join('; ');
        var emails = result.emails.map(function(email) {
          return email.text;
        }).join('; ');
        var socialIds = result.socialIds.map(function(socialId) {
          return socialId.text;
        }).join('; ');
        var reviewIds = result.reviewIds.map(function(reviewId) {
          return reviewId.text;
        }).join('; ');
        var images = (result.images || []).map(function(image) {
          return image.source;
        }).join('; ');
        data.push([
          result.url,
          linkPrefix + result.link,
          result.title,
          result.highRisk ? 'yes' : 'no',
          result.date.text,
          locations,
          phones,
          emails,
          socialIds,
          reviewIds,
          images,
          result.description.replace(/\n/g, ' ')
        ]);
      });
      return data;
      */
      return [];
    },

    createExportDataForPdf: function(results) {
      var linkPrefix = window.location.hostname + ':' + window.location.port;
      var data = [];
      var nextId = 1;

      /*
      results.forEach(function(result) {
        var locations = result.locations.map(function(location) {
          return location.textAndCountry;
        }).join(', ');
        var phones = result.phones.map(function(phone) {
          return phone.text;
        }).join(', ');
        var emails = result.emails.map(function(email) {
          return email.text;
        }).join(', ');
        var socialIds = result.socialIds.map(function(socialId) {
          return socialId.text;
        }).join(', ');
        var reviewIds = result.reviewIds.map(function(reviewId) {
          return reviewId.text;
        }).join(', ');

        var item = {
          images: (result.images || []).map(function(image) {
            return {
              id: 'image' + nextId++,
              source: encodeURIComponent(image.source.replace('https://s3.amazonaws.com/', '')),
              text: image.source
            };
          }),
          paragraphs: []
        };

        item.paragraphs.push({
          big: true,
          label: result.title,
          value: ''
        });
        item.paragraphs.push({
          label: 'High Risk:  ',
          value: result.highRisk ? 'Yes' : 'No'
        });
        item.paragraphs.push({
          label: 'Posting Date:  ',
          value: result.date.text
        });
        item.paragraphs.push({
          label: 'Locations:  ',
          value: locations
        });
        item.paragraphs.push({
          label: 'Telephone Numbers:  ',
          value: phones
        });
        item.paragraphs.push({
          label: 'Email Addresses:  ',
          value: emails
        });
        item.paragraphs.push({
          label: 'Social Media IDs:  ',
          value: socialIds
        });
        item.paragraphs.push({
          label: 'Review IDs:  ',
          value: reviewIds
        });
        item.paragraphs.push({
          label: 'Description:  ',
          value: result.description.replace(/\n/g, ' ')
        });
        item.paragraphs.push({
          label: 'URL:  ',
          value: result.url
        });
        item.paragraphs.push({
          label: 'DIG URL:  ',
          value: linkPrefix + result.link
        });

        data.push(item);
      });
      */

      return data;
    },

    revisions: function(data) {
      if(data && data.aggregations) {
        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        var total = data.aggregations.revisions.doc_count;
        var revisions = _.map(data.aggregations.revisions.revisions.buckets, function(bucket) {
          return {
            date: commonTransforms.getDate(bucket.key_as_string),
            list: [{
              count: bucket.doc_count,
              label: 'Revision on ' + commonTransforms.getDate(bucket.key_as_string)
            }]
          };
        });
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */
        return (total < 2 ? [] : revisions);
      }
      return [];
    },

    /**
     * Returns the formatted telephone number.
     */
    formattedTelephoneNumber: function(number) {
      return commonTransforms.getFormattedPhone(number);
    }
  };
});
