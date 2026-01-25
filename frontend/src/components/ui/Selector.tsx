import { Component, mergeProps } from 'solid-js'
import { Select, SelectValueChangeDetails, createListCollection } from '@ark-ui/solid'
import { For, createMemo } from 'solid-js'

import '../styles/selector.css'

const Selector: Component<{
  classNames?: string
  label?: string
  value?: string
  data?: { value: string; label: string }[]
  placeholder?: string
  onValueChanged?: (v: SelectValueChangeDetails) => unknown
}> = (props) => {
  const p = mergeProps(
    {
      value: undefined,
      label: undefined,
      data: [],
      placeholder: '',
      onValChanged: (_: SelectValueChangeDetails) => {},
    },
    props,
  )

  const collection = createMemo(() =>
    createListCollection({
      items: p.data,
    }),
  )

  return (
    <Select.Root
      class={p.classNames}
      multiple={false}
      value={p.value ? [p.value] : []}
      collection={collection()}
      positioning={{ sameWidth: true }}
      onValueChange={(v) => p.onValueChanged?.(v)}
    >
      <Select.Label>{p.label}</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={p.placeholder} />
          <div class="i-ri-expand-up-down-line h-4 w-4 text-text" />
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content>
          <For each={collection().group()}>
            {([type, group]) => (
              <Select.ItemGroup>
                <Select.ItemGroupLabel>{type}</Select.ItemGroupLabel>
                <For each={group}>
                  {(item) => (
                    <Select.Item item={item}>
                      <Select.ItemText>{item.label}</Select.ItemText>
                      <Select.ItemIndicator>✓</Select.ItemIndicator>
                    </Select.Item>
                  )}
                </For>
              </Select.ItemGroup>
            )}
          </For>
        </Select.Content>
      </Select.Positioner>
      <Select.HiddenSelect />
    </Select.Root>
  )
}

export { Selector }
