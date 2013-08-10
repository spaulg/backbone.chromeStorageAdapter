
# chrome.storage API Storage Adapter

A storage adapter for backbone.js for storage of data with the chrome.storage API
that Google have made specifically for Chrome browser plugins.

Designed to optionally be used with the backbone.storageProxy.js plugin.

## Usage

```html
<script src="backbone.js"></script>
<script src="backbone.chromeStorage.js"></script>
```

To store data using the local storage area only. The storage area parameter can also
be omitted for using local storage.

```javascript
var model = Backbone.Model.extend({
     this.chromeStorage = new Backbone.ChromeStorage('MyNamespace', Backbone.ChromeStorage.StorageArea.LOCAL),

     sync: function(method, model, options)
     {
         return this.chromeStorage.sync(method, model, options);
     }
});
```

To store data using the sync storage area:

```javascript
var model = Backbone.Model.extend({
    this.chromeStorage = new Backbone.ChromeStorage('MyNamespace', Backbone.ChromeStorage.StorageArea.SYNC),

    sync: function(method, model, options)
    {
        return this.chromeStorage.sync(method, model, options);
    }
});
```

To use alongside backbone.storageProxy.js:

```javascript
var model = Backbone.Model.extend({
    initialize: function()
    {
        this.storageProxy = new Backbone.StorageProxy(this, new Backbone.ChromeStorage('MyNamespace');
    }
});
```

Any subsequent call to the sync method on a model or collection with the storage adapter applied will
have its data processed into the chrome.storage API. As the save, fetch or destroy methods forward
to the sync method associated to their respective model or collection, those calls will also be handled
by the storage adapter and thus the chrome.storage API.

## License

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
