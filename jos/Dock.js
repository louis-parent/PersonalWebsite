const DockPosition = Object.freeze({
	Top: "top",
	Right: "right",
	Bottom: "bottom",
	Left: "left"
});

const DockVisibility = Object.freeze({
	AlwaysShow: "show",
	AlwaysHide: "hide",
	ShowOnHover: "hover"
});

class Dock extends Listenable
{
	constructor(os, options)
	{
		super();
		
		this.os = os;
		
		this.element = null;
		this.launchers = new Object();
		
		this.generateElement(options);
		
		this.setPosition(options?.position || DockPosition.Bottom);
		this.setVisibility(options?.visibility || DockVisibility.AlwaysShow);
	}
	
	generateElement(options)
	{
		this.element = document.createElement("div");
		this.element.classList.add("jos-dock");
		
		for(let c of (options?.classes || new Array()))
		{
			this.element.classList.add(c);
		}
	}
	
	setPosition(position)
	{
		this.position = position;
		
		switch(this.position)
		{
			case DockPosition.Top:
				this.setPositionConstraints({
					top: 0,
					left: "50%"
				});
				this.getElement().style.transform = "translateX(-50%)";
				break;
				
			case DockPosition.Right:
				this.setPositionConstraints({
					right: 0,
					top: "50%"
				});
				this.getElement().style.transform = "translateY(-50%)";
				break;

			case DockPosition.Left:
				this.setPositionConstraints({
					left: 0,
					top: "50%"
				});
				this.getElement().style.transform = "translateY(-50%)";
				break;
				
			default:
			case DockPosition.Bottom:
				this.setPositionConstraints({
					bottom: 0,
					left: "50%"
				});
				this.getElement().style.transform = "translateX(-50%)";
				break;
		}
	}
	
	setPositionConstraints(constraints)
	{
		this.getElement().style.top = constraints.top;
		this.getElement().style.right = constraints.right;
		this.getElement().style.bottom = constraints.bottom;
		this.getElement().style.left = constraints.left;
	}
	
	getPosition(position)
	{
		return this.position;
	}
	
	setVisibility(visibility)
	{
		this.visibility = visibility;
	}
	
	getVisibility()
	{
		return this.visibility;
	}
	
	addLauncherFor(window)
	{		
		this.launchers[window.wuid] = new Launcher(window);
		this.getElement().appendChild(this.launchers[window.wuid].getElement());
	}
	
	removeLauncherFor(window)
	{
		this.launchers[window.wuid].remove();
		this.launchers[window.wuid] = undefined;
	}
	
	getElement()
	{
		return this.element;
	}
}

class Launcher extends Listenable
{
	constructor(window)
	{
		super();
		
		this.os = window.os;
		this.window = window;
		this.ships = new Array();
		
		this.window.addEventListener("open", () => {
			this.addLauncherShip();
		});
		
		this.window.addEventListener("close", () => {
			this.removeLauncherShip();
		});
		
		this.element = null;
		this.shipRack = null;
		
		this.generateElement(window);
	}
	
	generateElement(window)
	{
		this.element = document.createElement("div");
		this.element.classList.add("jos-launcher");
		
		let icon = document.createElement("img");
		icon.classList.add("jos-launcher-icon");
		icon.src = window.getIcon();
		this.element.appendChild(icon);
		
		this.shipRack = document.createElement("span");
		this.shipRack.classList.add("jos-launcher-ships");
		this.element.appendChild(this.shipRack);
		
		this.element.addEventListener("click", event => {
			this.click(event);
		});
	}
		
	getElement()
	{
		return this.element;
	}
	
	addLauncherShip()
	{
		let ship = new LauncherShip({
			os: this.os,
			launcher: this
		});
		this.ships.push(ship);
		this.shipRack.appendChild(ship.getElement());
	}
	
	removeLauncherShip()
	{
		let ship = this.ships.pop();
		this.shipRack.removeChild(ship.getElement());
	}
	
	click(event) 
	{
		if(this.window.isClosed())
		{
			this.window.open();
		}
		else
		{
			this.window.minimize();
			
			if(!this.window.isMinimized())
			{
				this.window.bringToFront();
			}
		}
	}
}

class LauncherShip extends Listenable
{
	constructor(options)
	{
		super();
		
		this.os = options?.os;
		this.launcher = options?.launcher;
		
		this.element = null;
		
		this.generateElement();
	}
	
	generateElement()
	{
		this.element = document.createElement("span");
		this.element.classList.add("jos-launcher-ship");
	}
	
	getElement()
	{
		return this.element;
	}
}
