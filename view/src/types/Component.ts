export default interface Component {
  name: string;
  render: (
    parent: Node,
    anchor: Node | null,
    $props?: Object,
    $slots?: Object,
    $context?: Object,
  ) => void;
}
