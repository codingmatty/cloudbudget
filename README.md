# CloudBudget

### Deploy:

* Checkout `master` and make sure `develop` is merged into `master`.
* `npm version [major|minor|patch]`
* Checkout `develop` and merge `master` into `develop`.
* On production machine (as www-data):
  * `git pull`
  * `git checkout tags/v[version]`
  * `npm install`
  * `npm start`
