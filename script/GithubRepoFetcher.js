class Repository
{
	constructor(values, ressources)
	{
		this.name = values?.name || "";
		this.href = values?.html_url || "";
		this.description = values?.description || "";
		this.date = values?.created_at || "";
		this.clone = values?.clone_url || "";
		this.language = values?.language || "";
		
		for(let ressource in ressources)
		{
			this[ressource] = "https://raw.githubusercontent.com/" + values?.full_name + "/" + values?.default_branch + "/" + ressources[ressource];
		}
	}
}

class GithubRepoFetcher
{
	constructor(username, options)
	{
		this.url = GithubRepoFetcher.urlBuilder(username);
		this.ressources = options?.ressources || {};
		this.ajax = options?.requestBuilder || {
			get: GithubRepoFetcher.requestPromiseWithFetch
		};
	}
	
	fetch(options)
	{
		return new Promise((success, error) => {
			this.ajax.get(this.url, Object.assign(this.getFilterOptions(options), this.getSortOptions(options))).then(data => {
				success(this.parseRepositories(data));
			}).catch(err => {
				error(err);
			});
		});
	}
	
	getFilterOptions(options)
	{
		if(options?.filter === "owned")
		{
			return {
				type: "owner"
			};
		}
		else if(options?.filter === "participated")
		{
			return {
				type: "member"
			};
		}
		else if(options?.filter === "all" || options?.filter === undefined)
		{
			return {
				type: "all"
			};
		}
		else
		{
			throw new Error(options?.filter + " is not a valid RepoFetcher filter");
		}
	}
	
	getSortOptions(options)
	{
		if(options?.sort === "new-first")
		{
			return {
				sort: "created",
				direction: "desc"
			};
		}
		else if(options?.sort === "old-first")
		{
			return {
				sort: "created",
				direction: "asc"
			};
		}
		else if(options?.sort === "recent-first")
		{
			return {
				sort: "updated",
				direction: "desc"
			};
		}
		else if(options?.sort === "reverse-alphabetical")
		{
			return {
				sort: "full_name",
				direction: "asc"
			};
		}
		else if(options?.sort === "alphabetical" || options?.sort === undefined)
		{
			return {
				sort: "full_name",
				direction: "desc"
			};
		}
		else
		{
			throw new Error(options?.sort + " is not a valid RepoFetcher sort");
		}
	}
	
	parseRepositories(rawData)
	{
		let repositories = [];
		
		JSON.parse(rawData).forEach(repository => {
			repositories.push(new Repository(repository));
		});
		
		return repositories;
	}
	
	static urlBuilder(username)
	{
		return "https://api.github.com/users/" + username + "/repos";
	}
	
	static requestPromiseWithFetch(url, data)
	{
		let urlData = "";
		for(let key in data)
		{
			urlData += key + "="+ data[key] + "&";
		}
		
		if(urlData.length > 0)
		{
			url += "?" + urlData;
		}
		
		return new Promise((success, error) => {
			fetch(url, {
				method: "GET"
			}).then(response => {
				response.text().then(data => {
					success(data);
				}).catch(err => {
					error(err);
				});
			}).catch(err => {
				error(err);
			});
		});
	}
}
