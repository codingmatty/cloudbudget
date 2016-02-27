# CloudBudget

This is a revamp of [Cloudbudget-Legacy](https://github.com/mattjdev/cloudbudget-legacy).
I restarted with a different approach, and to be able to use ES2015 and a different frontend framework, currently VueJS.
Similar concepts apply, but I started with focus on being able to manage users, accounts and transactions first and formost.
I already need to go back to the drawing board to create a better user experience, but that is the nature of this project, always learning an reiterating.


## Notes: 

### Deploy:

* Checkout `master` and make sure `develop` is merged into `master`.
* `npm version [major|minor|patch]`
* Checkout `develop` and merge `master` into `develop`.
* On production machine (as www-data):
  * `git pull`
  * `git checkout tags/v[version]`
  * `npm install`
  * `npm start`
