export default interface Component {
  name: string;
  render: (parent: Node, anchor: Node | null) => void;
}
