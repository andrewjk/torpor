# Tera

Examples from [Component Party](https://component-party.dev).

## Declare state

```
<script>
  let $state = $watch({
    name: "John"
  });
</script>

<h1>Hello {$state.name}</h1>
```

## Update state

```
<script>
  let $state = $watch({
    name: "John"
  });
  $state.name = "Jane"
</script>

<h1>Hello {$state.name}</h1>
```

## Computed state

```
<script>
  let $state = $watch({
    count: 10,
    get doubleCount() {
        return this.count * 2;
    }
  });
</script>

<div>{$state.doubleCount}</div>
```

## Minimal template

```
<h1>Hello world</h1>
```

## Styling

```
<div>
  <h1 class="title">I am red</h1>
  <button style="font-size: 10rem;">I am a button</button>
</div>

<style>
  .title {
    color: red;
  }
</style>
```

## Loop

```
<script>
  const colors = ["red", "green", "blue"];
</script>

<ul>
  @for (let color of colors) {
    @key = color
    <li>{color}</li>
  }
</ul>
```

## Event click

```
<script>
  let $state = $watch({
    count: 0
  });

  function incrementCount() {
    $state.count++;
  }
</script>

<div>
  <p>Counter: {$state.count}</p>
  <button onclick={incrementCount}>+1</button>
</div>
```

## Dom ref

```
<script>
  let inputElement;

  $run(() => {
    inputElement.focus();
  });
</script>

<input bind:self={inputElement} />
```

## Conditional

```
<script>
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
</script>

<div>
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
</div>
```

## On mount

```
<script>
  let $state = $watch({
    pageTitle: ""
  });

  $run(() => {
    $state.pageTitle = document.title;
  });
</script>

<p>Page title: {$state.pageTitle}</p>
```

## On unmount

```
<script>
  let $state = $watch({
    time: new Date().toLocaleTimeString()
  });

  $run(() => {
    const timer = setInterval(() => {
      $state.time = new Date().toLocaleTimeString();
    }, 1000);

    return () => clearInterval(timer);
  });
</script>

<p>Current time: {$state.time}</p>
```

## Props

```
<UserProfile
  name="John"
  age={20}
  favouriteColors={["green", "blue", "red"]}
  isAvailable
/>

<template name="UserProfile">
  /**
  * @prop {string} name
  * @prop {number} age
  * @prop {string[]} favouriteColors
  * @prop {boolean} isAvailable
  */

  <div>
    <p>My name is {$props.name}!</p>
    <p>My age is {$props.age}!</p>
    <p>My favourite colors are {$props.favouriteColors.join(", ")}!</p>
    <p>I am {$props.isAvailable ? "available" : "not available"}</p>
  </div>
</template>
```

## Emit to parent

```
<script>
  let $state = $watch({
    isHappy: true
  });

  function onAnswerNo() {
    $state.isHappy = false;
  }

  function onAnswerYes() {
    $state.isHappy = true;
  }
</script>

<div>
  <p>Are you happy?</p>
  <AnswerButton onYes={onAnswerYes} onNo={onAnswerNo} />
  <p style="font-size: 50px;">{$state.isHappy ? "😀" : "😥"}</p>
</div>

<template name="AnswerButton">
  /**
  * @prop {Function} onYes
  * @prop {Function} onNo
  */

  <div>
    <button onclick={$props.onYes}>YES</button>

    <button onclick={$props.onNo}>NO</button>
  </div>
</template>
```

## Slot fallback

```
<div>
  <FunnyButton />
  <FunnyButton>Click me!</FunnyButton>
</div>

<template name="FunnyButton">
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
</template>
```

## Context

```
<script>
  const $user = $watch({
    id: 1,
    username: "unicorn42",
    email: "unicorn42@example.com",
  });

  // TODO: I think we're supposed to $unwrap this and pass in an update function?
  $context.user = $user;
</script>

<div>
  <h1>Welcome back, {$user.username}</h1>
  <UserProfileContext />
</div>

<template name="UserProfileContext">
  <script>
      $context.user = $watch($context.user);
  </script>

  <div>
    <h2>My Profile</h2>
    <p>Username: {$context.user.username}</p>
    <p>Email: {$context.user.email}</p>
    <button onclick={() => ($context.user.username = "Jane")}>
      Update username to Jane
    </button>
  </div>
</template>
```

## Input text

```
<script>
  let $state = $watch({
    text: "Hello World"
  });
</script>

<div>
  <p>{$state.text}</p>
  <input bind:value={$state.text} />
</div>
```

## Checkbox

```
<script>
  let $state = $watch({
    isAvailable: false
  });
</script>

<div>
  <div>{$state.isAvailable ? "Available" : "Not available"}</div>

  <input id="is-available" type="checkbox" bind:checked={$state.isAvailable} />
  <label for="is-available">Is available</label>
</div>
```

## Radio

```
<script>
  let $state = $watch({
    picked: "red"
  });
</script>

<div>
  <div>Picked: {$state.picked}</div>

  <input id="blue-pill" bind:group={$state.picked} type="radio" value="blue" />
  <label for="blue-pill">Blue pill</label>

  <input id="red-pill" bind:group={$state.picked} type="radio" value="red" />
  <label for="red-pill">Red pill</label>
</div>
```

## Select

```
<script>
  let $state = $watch({
    selectedColorId: 2
  });

  const colors = [
    { id: 1, text: "red" },
    { id: 2, text: "blue" },
    { id: 3, text: "green" },
    { id: 4, text: "gray", isDisabled: true },
  ];
</script>

<div>
  <div>Selected: {colors[$state.selectedColorId - 1].text}</div>

  <select bind:value={$state.selectedColorId}>
    @for (let color of colors) {
      <option value={color.id} disabled={color.isDisabled}>
        {color.text}
      </option>
    }
  </select>
</div>
```
