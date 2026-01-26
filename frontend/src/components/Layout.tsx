import { Component, createMemo, createSignal, onMount, Show } from "solid-js";
import { useLocation, useNavigate, A } from "@solidjs/router";
import { Collapsible } from "@ark-ui/solid/collapsible";
import clsx from "clsx";
import { OsService } from "#/bridgetts/services";
import { Tabs } from "@ark-ui/solid";

import "~/components/styles/collapsible.css";
import "~/components/styles/tabs-vertical.css";

const Layout: Component<{ children: any }> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();

  const lastPathFragment = createMemo(() => {
    const pathname = location.pathname;
    return pathname.substring(pathname.lastIndexOf("/") + 1);
  });

  const activeTab = createMemo(() =>
    lastPathFragment().length > 0 ? lastPathFragment() : "",
  );

  const [goos, setGoos] = createSignal<string>("");

  onMount(async () => {
    setGoos(await OsService.GetOs());
  });

  const [sideOpen, setSideOpen] = createSignal(true);

  return (
    <div class="min-h-screen w-full bg-bg flex">
      <Collapsible.Root
        open={sideOpen()}
        onOpenChange={(v) => setSideOpen(v.open)}
      >
        <Collapsible.Trigger
          class={clsx(
            "absolute top-2.5",
            goos() === "darwin" ? "left-23" : "left-4",
          )}
        >
          <Collapsible.Indicator>
            <div class="i-ri-side-bar-line w-5 h-5" />
          </Collapsible.Indicator>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Show when={goos() === "darwin"}>
            <div class="w-full h-40px" />
          </Show>
          <Tabs.Root
            class={clsx("SideBar")}
            orientation="vertical"
            value={activeTab()}
            onValueChange={({ value }) => {
              navigate(`/${value}`);
            }}
          >
            <Tabs.Trigger value="">
              <A href="">
                <div class="i-ri-computer-line" />
                Native TTS
              </A>
            </Tabs.Trigger>
            <Tabs.Trigger value="edge">
              <A href="edge">
                <div class="i-ri-edge-new-fill" />
                Edge TTS
              </A>
            </Tabs.Trigger>
            <Tabs.Trigger value="settings">
              <A href="settings">
                <div class="i-ri-settings-line" />
                Settings
              </A>
            </Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.Root>
        </Collapsible.Content>
      </Collapsible.Root>

      <main
        class={clsx(
          "flex-1 container min-w-600px max-w-1200px mx-auto px-4 py-6",
          goos() === "darwin" && "mt-20px",
        )}
      >
        {props.children}
      </main>
    </div>
  );
};

export default Layout;
