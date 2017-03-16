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

/* exported searchTransform */
/* jshint camelcase:false */

var searchTransform = (function(_) {
  function getPredicate(type) {
    switch(type) {
      case 'description': return 'content';
      case 'location': return 'location';
      case 'money': return 'money';
      case 'org': return 'org';
      case 'person': return 'person';
      case 'postingDate': return 'posting_date';
      case 'product': return 'product';
      case 'ticker': return 'ticker';
      case 'title': return 'title';
      case 'url': return 'url';
    }
  }

  return {
    result: function(response) {
      if(response && response.length && response[0].result) {
        return response[0].result;
      }
      return {};
    },

    search: function(page, pageSize, searchParameters) {
      var clauses = [];
      var filters = [];
      var groupBy;
      var hasDateFilter = false;

      if(!_.isEmpty(searchParameters)) {
        _.keys(searchParameters).forEach(function(type) {
          var predicate = getPredicate(type);
          _.keys(searchParameters[type]).forEach(function(term) {
            if(searchParameters[type][term].enabled) {
              if(type === 'postingDate') {
                hasDateFilter = true;

                if(filters.length === 0) {
                  filters.push({});
                }

                if(!filters[0].operator) {
                  filters[0].operator = 'and';
                }

                if(!filters[0].clauses) {
                  filters[0].clauses = [];
                }

                filters[0].clauses.push({
                  constraint: searchParameters[type][term].date,
                  operator: term === 'dateStart' ? '>' : '<',
                  variable: '?date'
                });

              } else if(predicate) {
                clauses.push({
                  constraint: searchParameters[type][term].key,
                  isOptional: true,
                  predicate: predicate
                });
              }
            }
          });
        });

        if(hasDateFilter) {
          clauses.push({
            isOptional: false,
            predicate: 'posting_date',
            variable: '?date'
          });
        }

        groupBy = (!page || !pageSize) ? undefined : {
          limit: pageSize,
          offset: (page - 1) * pageSize
        };
      }

      return {
        SPARQL: {
          'group-by': groupBy,
          select: {
            variables: [{
              type: 'simple',
              variable: '?doc_id'
            }, {
              type: 'simple',
              variable: '?fields'
            }, {
              type: 'simple',
              variable: '?tld'
            }, {
              type: 'simple',
              variable: '?url'
            }]
          },
          where: {
            clauses: clauses,
            filters: filters,
            type: 'Doc',
            variable: '?doc'
          }
        },
        type: 'Point Fact'
      };
    }
  };
});

