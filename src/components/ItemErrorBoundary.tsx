import { Component, type ErrorInfo, type ReactNode } from "react";

interface ItemErrorBoundaryProps {
  itemId: string;
  fallback: ReactNode;
  children: ReactNode;
}

interface ItemErrorBoundaryState {
  failed: boolean;
}

export class ItemErrorBoundary extends Component<ItemErrorBoundaryProps, ItemErrorBoundaryState> {
  state: ItemErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ItemErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`File manager row failed (${this.props.itemId})`, error, info);
  }

  componentDidUpdate(prevProps: ItemErrorBoundaryProps): void {
    if (prevProps.itemId !== this.props.itemId && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
