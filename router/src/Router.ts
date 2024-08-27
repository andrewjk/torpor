import Route from './types/Route'
import Options from './types/Options'

export default class Router {
  routes: Route[] = [];
  root = '/';
  componentNames: string[] = [];
  layoutName: string = '';
  componentName: string = '';

  #current: string = '';

  constructor (options?: Options) {
    if (options) {
      if (options.routes) {
        this.routes = options.routes
      }
      if (options.root) {
        this.root = options.root
      }
      if (options.componentNames) {
        this.componentNames = options.componentNames
      }
      if (options.layoutName) {
        this.layoutName = options.layoutName
      }
      if (options.componentName) {
        this.componentName = options.componentName
      }
    }
  }

  listen = function (this: Router) {
    // Listen for changes to the URL that occur when the user navigates using the back or forward buttons
    window.addEventListener('popstate', this.handleNavigation)
  }

  clearSlashes = function (path: string) {
    return path
      .toString()
      .replace(/\/$/, '')
      .replace(/^\//, '')
  }

  getFragment = function (this: Router) {
    let fragment = this.clearSlashes(decodeURI(window.location.pathname + window.location.search))
    fragment = fragment.replace(/\?(.*)$/, '')
    fragment = this.root !== '/' ? fragment.replace(this.root, '') : fragment
    return this.clearSlashes(fragment)
  }

  navigate = function (this: Router, path: string = '') {
    window.history.pushState(null, '', this.root + this.clearSlashes(path))
    // Manually fire popstate so that we can handle the change through handleNavigation
    // window.dispatchEvent(new Event('popstate'))
    return this
  }

  link = async function (this: Router, e: Event) {
    e.preventDefault()

    // Do the fetch and wait for a response
    const href = (<HTMLLinkElement>e.currentTarget)?.href
    if (href) {
      // TODO:
      const url = new URL(href)
      this.navigate(url.pathname)

      const response = await fetch(href, {
        method: 'GET',
        headers: {
          'X-WebThing-Patch': 'true'
        }
      })
      const model = await response.json()
      console.log('PATCH', model)
      // this._patch(model)

      // TODO: Remove the old replace script, if there is one, so we don't end up with a massive page?

      // Build the script
      const self = this
      let script = `state = wt.wrap(${model.state});`
      let newComponentName = ''
      for (const componentName in model.components) {
        if (Object.prototype.hasOwnProperty.call(model.components, componentName)) {
          if (!self.componentNames.some(c => c === componentName)) {
            // script = script + `\nif (!${componentName}) { ${model.components[componentName]} }`
            script = script + '\n' + model.components[componentName]
            self.componentNames.push(componentName)
          }
          newComponentName = componentName
        }
      }
      script = script + `
hmr.forEach(m => {{
  m.state = state;
  wt.patch(m.def, ${newComponentName}, m.state, '${this.componentName}');
}});`

      // Add the new script
      const newScript = document.createElement('script')
      // newScript.id = 'wt-patch-script'
      newScript.textContent = script
      document.body.appendChild(newScript)

      this.componentName = newComponentName

      // Add new styles
      const existingStyles = Array.from(document.getElementsByTagName('style'))
      for (const styleName in model.styles) {
        if (Object.prototype.hasOwnProperty.call(model.styles, styleName)) {
          if (!existingStyles.some(s => s.id === styleName)) {
            const newStyle = document.createElement('style')
            newStyle.id = styleName
            newStyle.textContent = model.styles[styleName]
            document.body.appendChild(newStyle)
          }
        }
      }
    }
  }

  handleNavigation = function (this: Router) {
    console.log('ROUTER: navigated!')
    if (this.#current === this.getFragment()) {
      return
    }
    this.#current = this.getFragment()

    this.routes.some(route => {
      const match = this.#current.match(route.path)
      if (match) {
        match.shift()
        route.cb.apply({}, match)
        return match
      }
      return false
    })
  }
}