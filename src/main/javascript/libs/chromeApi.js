
/*
 Copyright 2013 Simon Paulger <spaulger@codezen.co.uk>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var localStorageSpace = {};

var chrome = {
    storage: {
        local: {
            set: function(data, callback) {
                for (var key in data) {
                    localStorageSpace[key] = data[key];
                }

                callback();
            },

            get: function(data, callback) {
                var datas = [];
                for (var key in data) {
                    datas[key] = localStorageSpace[key];
                }

                callback(datas);
            },

            remove: function(data, callback) {
                for (var key in data) {
                    delete localStorageSpace[data[key]];
                }

                callback();
            }
        },
        sync: this.local
    },

    runtime: {
        lastError: null
    }
};
