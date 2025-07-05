# Torpor

Examples from [Component Party](https://component-party.dev).

## Declare state

```
export default function Name() {
  let $state = $watch({
    name: "John"
  });

  @render {
    <h1>Hello {$state.name}</h1>
  }
}
```

## Update state

```
export default function Name() {
  let $state = $watch({
    name: "John"
  });
  $state.name = "Jane"

  @render {
    <h1>Hello {$state.name}</h1>
  }
}
```

## Computed state

```
export default function DoubleCount() {
  let $state = $watch({
    count: 10,
    get doubleCount() {
        return this.count * 2;
    }
  });

  @render {
    <div>{$state.doubleCount}</div>
  }
```

## Minimal template

```
export default function HelloWorld() {
  @render {
    <h1>Hello world</h1>
  }
}
```

## Styling

```
export default function CssStyle() {
  @render {
    <h1 class="title">I am red</h1>
    <button style="font-size: 10rem;">I am a button</button>
  }

  @style {
    .title {
      color: red;
    }
  }
}
```

## Loop

```
export default function Colors() {
  const colors = ["red", "green", "blue"];

  @render {
    <ul>
      @for (let color of colors) {
        @key = color
        <li>{color}</li>
      }
    </ul>
  }
}
```

## Event click

```
export default function Counter() {
  let $state = $watch({
    count: 0
  });

  function incrementCount() {
    $state.count++;
  }

  @render {
    <p>Counter: {$state.count}</p>
    <button onclick={incrementCount}>+1</button>
  }
}
```

## Dom ref

```
export default function InputFocused() {
  let inputElement;

  $run(() => {
    inputElement.focus();
  });

  @render {
    <input &ref={inputElement} />
  }
}
```

## Conditional

```
export default function TrafficLight() {
  const TRAFFIC_LIGHTS = ["red", "orange", "green"];
  let $state = $watch({
    lightIndex: 0,
    get light() {
      return TRAFFIC_LIGHTS[this.lightIndex];
    }
  });

  function nextLight() {
    $state.lightIndex = ($state.lightIndex + 1) % TRAFFIC_LIGHTS.length;
  }

  @render {
    <button onclick={nextLight}>Next light</button>
    <p>Light is: {$state.light}</p>
    <p>
      You must
      @if ($state.light === "red") {
        <span>STOP</span>
      } else if ($state.light === "orange") {
        <span>SLOW DOWN</span>
      } else if ($state.light === "green") {
        <span>GO</span>
      }
    </p>
  }
}
```

## On mount

```
export default function PageTitle() {
  let $state = $watch({
    pageTitle: ""
  });

  $run(() => {
    $state.pageTitle = document.title;
  });

  @render {
    <p>Page title: {$state.pageTitle}</p>
  }
}
```

## On unmount

```
export default function Time() {
  let $state = $watch({
    time: new Date().toLocaleTimeString()
  });

  $run(() => {
    const timer = setInterval(() => {
      $state.time = new Date().toLocaleTimeString();
    }, 1000);

    return () => clearInterval(timer);
  });

  @render {
    <p>Current time: {$state.time}</p>
  }
}
```

## Props

```
export default function App() {
  @render {
    <UserProfile
      name="John"
      age={20}
      favouriteColors={["green", "blue", "red"]}
      isAvailable
    />
  }
}

function UserProfile($props = {
  name: "",
  age: null,
  favouriteColors: [],
  isAvailable: false,
}) {
  @render {
    <p>My name is {$props.name}!</p>
    <p>My age is {$props.age}!</p>
    <p>My favourite colors are {$props.favouriteColors.join(", ")}!</p>
    <p>I am {$props.isAvailable ? "available" : "not available"}</p>
  }
}
```

## Emit to parent

```
export default function App() {
  let $state = $watch({
    isHappy: true
  });

  function onAnswerNo() {
    $state.isHappy = false;
  }

  function onAnswerYes() {
    $state.isHappy = true;
  }

  @render {
    <p>Are you happy?</p>
    <AnswerButton onYes={onAnswerYes} onNo={onAnswerNo} />
    <p style="font-size: 50px;">{$state.isHappy ? "😀" : "😥"}</p>
  }
}

function AnswerButton($props = {
  onYes: () => null,
  onNo: () => null
}) {
  @render {
    <button onclick={$props.onYes}>YES</button>
    <button onclick={$props.onNo}>NO</button>
  }
}
```

## Slot fallback

```
export default function App() {
  @render {
    <FunnyButton />
    <FunnyButton>Click me!</FunnyButton>
  }
}

function FunnyButton() {
  @render {
    <button
      style="
        background: rgba(0, 0, 0, 0.4);
        color: #fff;
        padding: 10px 20px;
        font-size: 30px;
        border: 2px solid #fff;
        margin: 8px; transform: scale(0.9);
        box-shadow: 4px 4px rgba(0, 0, 0, 0.4);
        transition: transform 0.2s cubic-bezier(0.34, 1.65, 0.88, 0.925) 0s;
        outline: 0;
      "
    >
      <:slot>
        <span>No content found</span>
      </:slot>
    </button>
  }
}
```

## Context

```
export default function Context() {
  const $user = $watch({
    id: 1,
    username: "unicorn42",
    email: "unicorn42@example.com",
  });

  // TODO: I think we're supposed to $unwrap this and pass in an update function?
  $context.user = $user;

  @render {
    <h1>Welcome back, {$user.username}</h1>
    <UserProfileContext />
  }
}

function UserProfileContext() {
  $context.user = $watch($context.user);

  @render {
    <h2>My Profile</h2>
    <p>Username: {$context.user.username}</p>
    <p>Email: {$context.user.email}</p>
    <button onclick={() => ($context.user.username = "Jane")}>
      Update username to Jane
    </button>
  }
}
```

## Input text

```
export default function InputHello() {
  let $state = $watch({
    text: "Hello World"
  });

  @render {
    <p>{$state.text}</p>
    <input &value={$state.text} />
  }
}
```

## Checkbox

```
export default function IsAvailable() {
  let $state = $watch({
    isAvailable: false
  });

  @render {
    <div>{$state.isAvailable ? "Available" : "Not available"}</div>

    <input id="is-available" type="checkbox" &checked={$state.isAvailable} />
    <label for="is-available">Is available</label>
  }
}
```

## Radio

```
export default function PickPill() {
  let $state = $watch({
    picked: "red"
  });

  @render {
    <div>Picked: {$state.picked}</div>

    <input id="blue-pill" &group={$state.picked} type="radio" value="blue" />
    <label for="blue-pill">Blue pill</label>

    <input id="red-pill" &group={$state.picked} type="radio" value="red" />
    <label for="red-pill">Red pill</label>
  }
}
```

## Select

```
export default function ColorSelect() {
  let $state = $watch({
    selectedColorId: 2
  });

  const colors = [
    { id: 1, text: "red" },
    { id: 2, text: "blue" },
    { id: 3, text: "green" },
    { id: 4, text: "gray", isDisabled: true },
  ];

  @render {
    <div>Selected: {colors[$state.selectedColorId - 1].text}</div>

    <select &value={$state.selectedColorId}>
      @for (let color of colors) {
        <option value={color.id} disabled={color.isDisabled}>
          {color.text}
        </option>
      }
    </select>
  }
}
```
