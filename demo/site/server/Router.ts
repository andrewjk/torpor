import render from "../../../view/src/render/render";

// TODO:
// site/server/Host, Router, Middleware
// site/client/App, Router, Middleware
// cache layouts and requests and only re-fetch if they do not exist
// intercept links
// route params, search params, etc
// typing

interface Route {
  path: string;
  request: Function;
}

interface RoutePart {
  path: string;
  children: RoutePart[];
  request?: Function;
  layout?: Function;
  //active?: boolean;
}

export default class Router {
  root = "/";
  getRoutes: Route[] = [];
  postRoutes: Route[] = [];
  // put, delete, actions?
  getRouteParts: RoutePart = { path: "/", children: [] };

  #currentFragment = "?";

  // TODO: move this into App
  node: Node;

  constructor() {
    this.listen();
  }

  add(method: string, path: string, request: Function) {
    method = method.toUpperCase();
    switch (method) {
      case "GET": {
        //this.getRoutes.push({ path, request });
        const parts = this.trimPath(path).split("/");
        if (!parts.length) parts.push("");
        /*if (!parts.length) {
          let routeParts = this.getRouteParts.children.find((p) => p.path === "");
          if (!routeParts) {
            routeParts = { path: "", children: [] };
          routeParts.request = request;
        } else {*/
        let routeParts = this.getRouteParts;
        parts.forEach((p, i) => {
          let newRouteParts = routeParts.children.find((c) => c.path === p);
          if (!newRouteParts) {
            newRouteParts = {
              path: p,
              children: [],
            };
            routeParts.children.push(newRouteParts);
          }
          routeParts = newRouteParts;
          if (i === parts.length - 1) {
            routeParts.request = request;
          }
        });
        // }
        break;
      }
      case "POST": {
        this.postRoutes.push({ path, request });
        break;
      }
      default: {
        throw new Error(`method not supported: ${method}`);
      }
    }
  }

  trimPath(path: string) {
    return path.toString().replace(/\/$/, "").replace(/^\//, "");
  }

  getFragment() {
    let fragment = this.trimPath(decodeURI(window.location.pathname + window.location.search));
    fragment = fragment.replace(/\?(.*)$/, "");
    fragment = this.root !== "/" ? fragment.replace(this.root, "") : fragment;
    return this.trimPath(fragment);
  }

  get(path: string) {
    // TODO:
  }

  post(path: string) {
    // TODO:
  }

  listen() {
    // Listen for changes to the URL that occur when the user navigates using the back or forward buttons
    window.addEventListener("popstate", this.handleNavigation.bind(this));
  }

  goto(path = "") {
    window.history.pushState(null, "", this.root + this.trimPath(path));
    // Manually fire popstate so that we can handle the change through handleNavigation
    window.dispatchEvent(new Event("popstate"));
  }

  handleNavigation() {
    //console.log(this);
    const fragment = this.getFragment();
    console.log("ROUTER: navigated!", fragment);
    if (this.#currentFragment === fragment) {
      return;
    }

    this.#currentFragment = fragment;

    const parts = this.#currentFragment.split("/");
    if (!parts.length) parts.push("");
    console.log(parts);
    let routeParts: RoutePart | undefined = this.getRouteParts;
    for (let i = 0; i < parts.length; i++) {
      routeParts = routeParts.children.find((c) => c.path === parts[i].toLocaleLowerCase());
      if (!routeParts) break;
      /*if (i === parts.length - 1 && routeParts.request) {
        this.node.textContent = "";
        render(this.node, routeParts.request());
      }*/
    }
    if (routeParts?.request) {
      this.node.textContent = "";
      render(this.node, routeParts.request());
    }

    /*
    for (let route of this.getRoutes) {
      //console.log("checking", route);
      const match = this.#currentFragment.match(route.path);
      if (match) {
        match.shift();
        //route.request.apply({}, match);
        //console.log(route.request());
        this.node.textContent = "";
        render(this.node, route.request());
        break;
      }
    }
    */
  }
}
