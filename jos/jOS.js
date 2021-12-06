class jOS extends Listenable
{
	constructor(options)
	{
		super();
		
		this.root = options?.root || document.body;
		this.dock = new Dock(this, options?.dock);
		this.windows = new Array();
		
		this.init(options);
		this.addWindows(options?.windows || new Array());
	}
	
	init(options)
	{
		this.root.classList.add("jos-root");
		
		for(let c of (options?.classes || new Array()))
		{
			this.root.classList.add(c);
		}
		
		this.root.appendChild(this.dock.getElement());
		
		this.root.addEventListener("dragover", event => {
			this.emitEvent("dragover", event);
		});
	}
	
	addWindows(windows)
	{
		for(let window of windows)
		{
			this.addWindow(window);
		}
	}
	
	addWindow(window)
	{
		window.setOS(this);
		this.windows.push(window);
		
		this.dock.addLauncherFor(window);
		window.open();
	}
	
	removeWindow(window)
	{
		this.windows.filter(w => {
			return w != window
		});
		
		this.dock.removeLauncherFor(window);		
		window.close();
	}
	
	getRoot()
	{
		return this.root;
	}
	
	getSize()
	{
		let rect = this.getRoot().getBoundingClientRect();
		
		return {
			width: rect.width,
			height: rect.height
		};
	}
	
	bringToFront(window)
	{
		for(let w of this.windows)
		{
			if(w === window)
			{
				w.setDepth(this.windows.length-1);
			}
			else
			{
				w.bringBackward();
			}
		}
	}
	
	bringToBack(window)
	{
		for(let w of this.windows)
		{
			if(w === window)
			{
				w.setDepth(0);
			}
			else
			{
				w.bringForward();
			}
		}
	}
}
