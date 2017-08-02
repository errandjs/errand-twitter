# errand-twitter
> [errand](https://github.com/errandjs/errand) component for working with Twitter

## Usage

```

npm install errand-twitter

```

Notes:

1. For dependencies and suggested usage of errand worker components refer to [errand](https://github.com/errandjs/errand)
2. Set environment variables:
  2.1 ERRAND_MONGODB_URL with connection string for mongodb server, if not set module will default to `mongodb://localhost:27017`
  2.2 ERRAND_TWITTER_CONSUMER_KEY, ERRAND_TWITTER_CONSUMER_SECRET, ERRAND_TWITTER_ACCESS_TOKEN & ERRAND_TWITTER_ACCESS_TOKEN_SECRET with Twitter API credentials service, refer to https://apps.twitter.com/ as guide for configuration




## Example

```

{
	"tasks": [

		{
			"task": "errand-twitter",
			"data": {
				"description": "replace-with-task-description",
				"request": {
					"database": "replace-with-mongodb-database-name",
					"collection": "replace-with-name-of-target-collection-for-result",
					"past": "replace-with-name-of-collection-used-for-managing-history-about-requests"
					"method": "search",
					"parameters": {
						...
					}
				}
			}
		}

	]
}

```

Notes:

* **tasks** - [errand](https://github.com/errandjs/errand) task list
* **tasks[].task** - required `errand-twitter` task name
* **tasks[].data.description** - optional task description
* **tasks[].data.request.database** - required mongodb database name
* **tasks[].data.request.collection** - required mongodb collection used with request, in the case of search results will be inserted into collection
* **tasks[].data.request.past** - required mongodb collection used for managing history about previous requests, in the case of search method this will contain `since_id` which is used by Twitter API to page through results
* **tasks[].data.request.method** - required Twitter API method
* **tasks[].data.request.parameters** - required method parameters, the parameter payload will vary depending on method

### Search Example 

```

{
	"tasks": [

		{
			"task": "errand-twitter",
			"data": {
				"description": "replace-with-task-description",
				"request": {
					"database": "replace-with-mongodb-database-name",
					"collection": "replace-with-name-of-target-collection-for-result",
					"past": "replace-with-name-of-collection-used-for-managing-history-about-requests"
					"method": "search",
					"parameters": {
			            "q": "nodejs",
			            "count": 100,
			            "result_type": "recent"
					}
				}
			}
		}

	]
}

```

Notes:

* **tasks[].data.request.parameters** - required parameters for Twitter API search request, refer to https://dev.twitter.com/rest/public/search for details
* **tasks[].data.request.parameters.q** - required to query to search for
* **tasks[].data.request.parameters.count** - number of results to return on each request
* **tasks[].data.request.parameters.result_type** - type of search request

