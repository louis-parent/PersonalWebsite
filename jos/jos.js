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
		
		this.root.appendChild(window.getElement());
	}
	
	removeWindow(window)
	{
		this.windows.filter(w => {
			return w != window
		});
		
		this.dock.removeLauncherFor(window);
		
		this.root.removeChild(window.getElement());
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
		let launcher = document.createElement("img");
		launcher.classList.add("jos-launcher");
		launcher.src = window.getIcon();
		
		this.launchers[window.wuid] = launcher;
		this.getElement().appendChild(launcher);
	}
	
	removeLauncherFor(window)
	{
		this.launchers[window.wuid].remove();
		this.launchers[window.wuid] = undefined;
	}
	
	hashCode(object)
	{
		let str = JSON.stringify(object);		
		let hash = 0;
		
		for (let i = 0; i < str.length; i++)
		{
			let char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}

		return hash;
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
		
	}
}

class Window extends Listenable
{
	static windowIdGenerator()
	{
		let codes = new Array();
		
		for(let i = 0; i < 64; i++)
		{
			codes.push(Math.floor(Math.random() * 94) + 33);
		}
		
		return String.fromCharCode(...codes);
	}
	
	constructor(options)
	{
		super();
	
		this.wuid = options?.id || Window.windowIdGenerator();
		this.os = options?.os || null;
		
		this.element = null;
		this.title = null;
		this.content = null;
		
		this.bindedDragEvent = this.dragEvent.bind(this);
		this.bindedResizeEvent = this.resizeEvent.bind(this);
		
		this.emptyImage = new Image();
		this.emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

		this.generateElement(options);
		
		this.setDepth(options?.depth || 0);
		this.moveTo({
			x: options?.x || 0,
			y: options?.y || 0
		});
		this.resize({
			width: options?.width || 256,
			height: options?.height || 256
		});
	}
	
	generateElement(options)
	{
		this.element = document.createElement("div");
		this.element.classList.add("jos-window");
		
		this.element.addEventListener("mousedown", event => {
			this.getOS().bringToFront(this);
		});
				
		for(let c of (options?.classes || new Array()))
		{
			this.element.classList.add(c);
		}
		
		this.title = new WindowTitle(options);
		this.element.appendChild(this.title.getElement());
		
		this.title.addEventListener("dragstart", event => {
			this.startDrag(event);
		}, false);
		
		this.title.addEventListener("dragend", event => {
			this.endDrag(event);
		}, false);
		
		this.title.addEventListener("close", () => {
			this.close();
		});
		
		this.title.addEventListener("maximize", () => {
			this.maximize();
		});

		this.content = new WindowContent(options);
		this.element.appendChild(this.content.getElement());
		
		this.resizer = new WindowResizer(options);
		this.element.appendChild(this.resizer.getElement());
		
		this.resizer.addEventListener("dragstart", event => {
			this.startResize(event);
		});
		
		this.resizer.addEventListener("dragend", event => {
			this.endResize(event);
		});
	}
	
	startDrag(event)
	{
		let offsetX = event.offsetX;
		let offsetY = event.offsetY;

		let fullsizeRect = event.target.getBoundingClientRect();
		this.maximize(false);
		let reducesizeRect = event.target.getBoundingClientRect();
		
		event.dataTransfer.setData("application/json", JSON.stringify({
			offsetX: (offsetX / fullsizeRect.width) * reducesizeRect.width,
			offsetY: offsetY
		}));
		
		event.dataTransfer.setDragImage(this.emptyImage, 0, 0);
		
		this.getOS().addEventListener("dragover", this.bindedDragEvent, false);
		
		this.emitEvent("startdrag", {
			target: this
		});
	}
	
	endDrag(event)
	{
		this.getOS().removeEventListener("dragover", this.bindedDragEvent, false);
		
		this.emitEvent("startdrag", {
			target: this
		});
	}
	
	dragEvent(event)
	{
		let offsets = JSON.parse(event.dataTransfer.getData("application/json"));
		let x = 0;
		let y = 0;
		
		if(event.target === this.getOS().getRoot())
		{
			x = event.offsetX - offsets.offsetX;
			y = event.offsetY - offsets.offsetY;
		}
		else
		{
			let rect = event.target.getBoundingClientRect();
			x = rect.left + event.offsetX - offsets.offsetX;
			y = rect.top + event.offsetY - offsets.offsetY;
		}
		
		this.moveTo({
			x: x,
			y: y
		});
	}
	
	startResize(event)
	{
		let rect = this.getElement().getBoundingClientRect();
		event.dataTransfer.setData("application/json", JSON.stringify({
			startX: event.pageX,
			startY: event.pageY,
			startWidth: rect.width,
			startHeight: rect.height,
		}));
		event.dataTransfer.setDragImage(this.emptyImage, 0, 0);
		
		this.getOS().addEventListener("dragover", this.bindedResizeEvent, false);
		
		this.emitEvent("startresize", {
			target: this
		});
	}
	
	endResize(event)
	{
		this.getOS().removeEventListener("dragover", this.bindedResizeEvent, false);
		
		this.emitEvent("endresize", {
			target: this
		});
	}
	
	resizeEvent(event)
	{
		let data = JSON.parse(event.dataTransfer.getData("application/json"));
		this.resize({
			width: data.startWidth + (event.pageX - data.startX),
			height: data.startHeight + (event.pageY - data.startY)
		});
	}
	
	close()
	{
		this.emitEvent("close", {
			target: this
		});
		this.getElement().remove();
	}
	
	maximize(force)
	{
		if(force === undefined)
		{
			this.getElement().classList.toggle("jos-fullscreen");
		}
		else if(force === true)
		{
			this.getElement().classList.add("jos-fullscreen");
		}
		else
		{
			this.getElement().classList.remove("jos-fullscreen");
		}
	}
	
	setOS(os)
	{
		this.os = os;
	}
	
	getOS()
	{
		return this.os;
	}
	
	setIcon(icon)
	{
		this.title.setIcon(icon);
	}
	
	getIcon()
	{
		return this.title.getIcon();
	}
	
	showIcon(visible)
	{
		this.title.showIcon(visible);
	}
	
	isIconVisible()
	{
		return this.title.isIconVisible();
	}
	
	setTitle(title)
	{
		this.title.setTitle(title);
	}
	
	getTitle()
	{
		return this.title.getTitle();
	}
	
	showTitle(visible)
	{
		this.title.showTitle(visible);
	}
	
	isTitleVisible()
	{
		return this.title.isTitleVisible();
	}
	
	showMaximizeAction(visible)
	{
		this.title.showMaximizeAction(visible);
	}
	
	isMaximizable()
	{
		return this.title.isMaximizable();
	}
	
	showMinimizeAction(visible)
	{
		this.title.showMinimizeAction(visible);
	}
	
	isMinimizable()
	{
		return this.title.isMinimizable();
	}
	
	showCloseAction(visible)
	{
		this.title.showCloseAction(visible);
	}
	
	isClosable()
	{
		return this.title.isClosable();
	}
	
	setContent(content)
	{
		this.content.setContent(content);
	}
	
	getContent()
	{
		return this.content.getContent();
	}
	
	getElement()
	{
		return this.element;
	}
	
	isMaximized()
	{
		return this.getElement().classList.contains("jos-fullscreen");
	}
	
	isResizable()
	{
		return this.resizer.isResizable();
	}
	
	setResizable(resizable)
	{
		this.resizer.setResizable(resizable);
	}
	
	bringForward()
	{
		this.setDepth(this.getDepth() + 1);
	}
	
	bringBackward()
	{
		this.setDepth(Math.max(this.getDepth() - 1, 0));
	}
	
	getDepth()
	{
		return this.depth;
	}
	
	setDepth(depth)
	{
		this.depth = depth;
		this.getElement().style.zIndex = this.depth;
	}
	
	getWidth()
	{
		return this.width;
	}
	
	setWidth(width)
	{
		this.resize({
			width: width
		});
	}
	
	getHeight()
	{
		return this.height;
	}
	
	setHeight(height)
	{
		this.resize({
			height: height
		});
	}
	
	resize(size)
	{
		this.width = size?.width || this.width;
		this.height = size?.height || this.height;
		
		this.getElement().style.width = this.width + "px";
		this.getElement().style.height = this.height + "px";
		
		this.emitEvent("resized", {
			target: this,
			width: this.getWidth(),
			height: this.getHeight()
		});
	}
	
	getSize()
	{
		return {
			width: this.getWidth(),
			height: this.getHeight()
		};
	}
	
	getX()
	{
		return this.x;
	}
	
	setX(x)
	{
		this.moveTo({
			x: x
		});
	}
	
	getY()
	{
		return this.y;
	}
	
	setY(y)
	{
		this.moveTo({
			y: y
		});
	}
	
	moveTo(dest)
	{
		if(dest?.x !== undefined)
		{
			this.x = dest.x;
		}
		
		if(dest?.y !== undefined)
		{
			this.y = dest.y;
		}
		
		let translateX = "0";
		let translateY = "0";
		
		if(this.x !== 0)
		{
			translateX = "calc(" + this.x + "px + var(--window-padding))";
		}
		
		if(this.y !== 0)
		{
			translateY = "calc(" + this.y + "px + var(--window-padding))";
		}
		
		this.getElement().style.transform = "translate(" + translateX + ", " + translateY + ")";
		
		this.emitEvent("moved", {
			target: this,
			x: this.getX(),
			y: this.getY()
		});
	}
	
	getPosition()
	{
		return {
			x: this.getX(),
			y: this.getY()
		};
	}
}

class WindowTitle extends Listenable
{
	constructor(options)
	{
		super();
		
		this.config = new Object();
		
		this.element = null;
		this.icon = null;
		this.title = null;
		this.maximize = null;
		this.minimize = null;
		this.close = null;
		
		this.generateElement(options);
	}
	
	generateElement(options)
	{
		this.element = document.createElement("div");
		this.element.classList.add("jos-window-title");
		this.element.setAttribute("draggable", "true");
		
		this.element.addEventListener("dragstart", event => {
			this.emitEvent("dragstart", event);
		});
		
		this.element.addEventListener("dragend", event => {
			this.emitEvent("dragend", event);
		});
		
		this.element.appendChild(this.generateName(options));
		this.element.appendChild(this.generateActions(options));
	}
	
	generateName(options)
	{
		let name = document.createElement("span");
		name.classList.add("jos-window-title-name");
		
		this.icon = document.createElement("img");
		this.icon.alt = "Icon";
		this.setIcon(options?.icon);
		this.showIcon(options?.icon !== undefined && options?.showIcon !== false);
		name.appendChild(this.icon);
		
		this.title = document.createElement("span");
		this.setTitle(options?.title);
		this.showTitle(options?.title !== undefined && options?.showTitle !== false);
		name.appendChild(this.title);
		
		return name;
	}
	
	generateActions(options)
	{
		let actions = document.createElement("span");
		actions.classList.add("jos-window-title-actions");
		
		this.maximize = document.createElement("span");
		this.maximize.classList.add("jos-window-maximize");
		this.maximize.innerText = "□";
		this.maximize.addEventListener("click", () => {
			this.emitEvent("maximize");
		});
		this.showMaximizeAction(options?.maximizable !== false);
		actions.appendChild(this.maximize);
		
		this.minimize = document.createElement("span");
		this.minimize.classList.add("jos-window-minimize");
		this.minimize.innerText = "_";
		this.minimize.addEventListener("click", () => {
			this.emitEvent("minimize");
		});
		this.showMinimizeAction(options?.minimizable !== false);
		actions.appendChild(this.minimize);
		
		this.close = document.createElement("span");
		this.close.classList.add("jos-window-close");
		this.close.innerText = "X";
		this.close.addEventListener("click", () => {
			this.emitEvent("close");
		});
		this.showCloseAction(options?.closable !== false);
		actions.appendChild(this.close);
		
		return actions;
	}
	
	setIcon(icon)
	{
		this.config.icon = icon;
		this.icon.src = icon;
	}
	
	getIcon()
	{
		return this.config.icon;
	}
	
	showIcon(visible)
	{
		this.config.showIcon = visible === true;
		
		if(visible)
		{
			this.icon.classList.remove("jos-disable");
		}
		else
		{
			this.icon.classList.add("jos-disable");
		}
	}
	
	isIconVisible()
	{
		return this.config.showIcon;
	}
	
	setTitle(title)
	{
		this.config.title = title;
		this.title.innerHTML = title;
	}
	
	getTitle()
	{
		return this.config.title;
	}
	
	showTitle(visible)
	{
		this.config.showTitle = visible === true;
		
		if(visible)
		{
			this.title.classList.remove("jos-disable");
		}
		else
		{
			this.title.classList.add("jos-disable");
		}
	}
	
	isTitleVisible()
	{
		return this.config.showTitle;
	}
	
	showMaximizeAction(visible)
	{
		this.config.maximizable = visible === true;
		
		if(visible)
		{
			this.maximize.classList.remove("jos-disable");
		}
		else
		{
			this.maximize.classList.add("jos-disable");
		}
	}
	
	isMaximizable()
	{
		return this.config.maximizable;
	}
	
	showMinimizeAction(visible)
	{
		this.config.minimizable = visible === true;
		
		if(visible)
		{
			this.minimize.classList.remove("jos-disable");
		}
		else
		{
			this.minimize.classList.add("jos-disable");
		}
	}
	
	isMinimizable()
	{
		return this.config.minimizable;
	}
	
	showCloseAction(visible)
	{
		this.config.closable = visible === true;
		
		if(visible)
		{
			this.close.classList.remove("jos-disable");
		}
		else
		{
			this.close.classList.add("jos-disable");
		}
	}
	
	isClosable()
	{
		return this.config.closable;
	}
	
	getElement()
	{
		return this.element;
	}
}

class WindowContent extends Listenable
{
	constructor(options)
	{
		super();
		this.element = null;
		this.generateElement(options);
	}
	
	generateElement(options)
	{
		this.element = document.createElement("div");
		this.element.classList.add("jos-window-body");
		
		if(options?.content !== undefined)
		{
			this.element.appendChild(options.content);
		}
	}
	
	setContent(content)
	{
		this.element.firstChild.remove();
		this.element.appendChild(content);
	}
	
	getContent()
	{
		return this.element.firstChild;
	}
	
	getElement()
	{
		return this.element;
	}
}

class WindowResizer extends Listenable
{
	constructor(options)
	{
		super();

		this.resizable = true;
		this.element = null;

		this.generateElement(options);
	}
	
	generateElement(options)
	{
		this.element = document.createElement("div");
		this.element.classList.add("jos-window-resizer");
		this.element.setAttribute("draggable", "true");
		this.setResizable(options?.resizable !== false);
		
		this.element.addEventListener("dragstart", event => {
			this.emitEvent("dragstart", event);
		});
		
		this.element.addEventListener("dragend", event => {
			this.emitEvent("dragend", event);
		});
	}
	
	setResizable(resizable)
	{
		this.resizable = resizable;
		
		if(resizable)
		{
			this.element.classList.remove("jos-disable");
		}
		else
		{
			this.element.classList.add("jos-disable");
		}
	}
	
	isResizable()
	{
		return this.resizable;
	}
	
	getElement()
	{
		return this.element;
	}
}
