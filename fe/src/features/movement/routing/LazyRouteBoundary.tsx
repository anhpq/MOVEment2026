import {
  Component,
  Suspense,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {useTranslation} from "react-i18next";

function RouteLoadingFallback() {
  const {t} = useTranslation();
  const label = t("route.loading");

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      role="status"
      style={{
        alignContent: "center",
        display: "grid",
        gap: 12,
        justifyItems: "center",
        minHeight: "min(60dvh, 480px)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <progress aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function RouteErrorFallback() {
  const {t} = useTranslation();

  return (
    <section
      aria-live="assertive"
      role="alert"
      style={{
        alignContent: "center",
        display: "grid",
        gap: 12,
        justifyItems: "center",
        minHeight: "min(60dvh, 480px)",
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{fontSize: "1.25rem", margin: 0}}>
        {t("route.chunkErrorTitle")}
      </h1>
      <p style={{margin: 0, maxWidth: 520}}>
        {t("route.chunkErrorDescription")}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#9f301c",
          border: 0,
          borderRadius: 10,
          color: "#fff",
          cursor: "pointer",
          font: "inherit",
          fontWeight: 700,
          minHeight: 44,
          padding: "10px 18px",
        }}
        type="button"
      >
        {t("route.retry")}
      </button>
    </section>
  );
}

type RouteErrorBoundaryState = Readonly<{
  failed: boolean;
}>;

class RouteErrorBoundary extends Component<
  PropsWithChildren,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {failed: false};

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return {failed: true};
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <RouteErrorFallback />;
    }

    return this.props.children;
  }
}

export function LazyRouteBoundary({children}: PropsWithChildren) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}
