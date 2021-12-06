class Listenable
{
	constructor()
	{
		this.listeners = new Object();
	}
	
	addEventListener(event, callback)
	{
		if(this.listeners[event] === undefined)
		{
			this.listeners[event] = new Array();
		}
		
		this.listeners[event].push(callback);
	}
	
	removeEventListener(event, callback)
	{
		if(this.listeners[event] !== undefined)
		{
			this.listeners[event] = this.listeners[event].filter(currentCallback => {
				return currentCallback !== callback;
			});
		}
	}
	
	emitEvent(event, data)
	{
		if(this.listeners[event] !== undefined)
		{
			for(let callback of this.listeners[event])
			{
				callback(data);
			}
		}
	}
}
