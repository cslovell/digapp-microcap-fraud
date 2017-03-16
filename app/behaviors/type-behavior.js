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

/* globals DigBehaviors */
/* exported DigBehaviors */
var DigBehaviors = DigBehaviors || {};

/**
 * Polymer behavior for DIG data type-specific utility functions.
 */
DigBehaviors.TypeBehavior = {
  /**
   * Returns the link for the given type and id.
   */
  getPageLink: function(id, type) {
    if(!id || !type || !(type === 'cache' || type === 'doc' || type === 'ticker')) {
      return undefined;
    }

    return '/' + type + '.html?id=' + id;
  },

  /**
   * Returns the iron icon string for the given type.
   */
  getTypeIcon: function(type) {
    switch(type) {
      case 'age': return 'icons:schedule';
      case 'author': return 'icons:account-circle';
      case 'author_profile': return 'icons:info';
      case 'cache': return 'icons:cached';
      case 'creation_date': return 'social:cake';
      case 'company': return 'icons:work';
      case 'company_type': return 'icons:work';
      case 'date': return 'icons:date-range';
      case 'disclaimer': return 'icons:error';
      case 'doc': return 'icons:description';
      case 'followed_by': return 'social:group';
      case 'forum_name': return 'icons:account-circle';
      case 'location': return 'social:location-city';
      case 'moderator': return 'social:school';
      case 'money': return 'editor:attach-money';
      case 'number_of_posts': return 'communication:chat';
      case 'object_id': return 'social:person';
      case 'org': return 'social:group';
      case 'person': return 'social:person';
      case 'post_id': return 'social:person';
      case 'post_type': return 'icons:description';
      case 'product': return 'icons:work';
      case 'stocks_owned': return 'editor:show-chart';
      case 'ticker': return 'social:public';
      case 'ticker_symbol': return 'social:public';
      case 'website': return 'av:web';
    }
    return '';
  },

  /**
   * Returns the style class for the given type.
   */
  getTypeStyleClass: function(type) {
    if(!type) {
      return '';
    }
    return 'entity-' + type + '-font';
  }
};
