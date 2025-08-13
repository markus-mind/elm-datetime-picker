// https://wolfgangschuster.wordpress.com/2023/06/21/bring-your-own-dom-part-1-portals/

class PortalElement extends HTMLElement {
	constructor() {
		super();
		this._targetNode = document.createElement("div");
		this._targetNode.className = "elm-portal";
	}

	connectedCallback() {
		const destination = document.body;
		destination.appendChild(this._targetNode);
	}

	disconnectedCallback() {
		const destination = document.body;
		destination.removeChild(this._targetNode);
	}

	get childNodes() {
		return this._targetNode.childNodes;
	}

	replaceData(...args) {
		return this._targetNode.replaceData(...args);
	}

	removeChild(...args) {
		return this._targetNode.removeChild(...args);
	}

	insertBefore(...args) {
		return this._targetNode.insertBefore(...args);
	}

	appendChild(...args) {
		// To cooperate with the Elm runtime
		requestAnimationFrame(() => {
			return this._targetNode.appendChild(...args);
		});
	}
}

customElements.define("elm-portal", PortalElement);
