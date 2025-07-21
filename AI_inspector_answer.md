I apologize, it seems I cannot programmatically force the :hover state on the element and report the computed styles in this environment. My attempt to simulate it failed due to technical limitations in controlling the element's state in this way.

However, you can easily perform this check yourself using the Chrome DevTools UI:

Select the parent element: In the Elements tab, make sure the div element with the classes .group.block-wrapper.relative... (the parent of the selected element) is selected.
Force the state: In the Styles pane (usually on the right side), look for the :hov button (it looks like a dotted square with ":hov" inside). Click on it.
Check the :hover checkbox: A dropdown will appear with various states you can force. Check the box next to :hover.
By checking the :hover box on the parent element, you are telling DevTools to apply all CSS rules that would normally apply when that element is hovered.

Inspect the block-controls element: Now, while the parent element's :hover state is forced, select the div.block-controls element (you might need to find it in the Elements tree; it should become visible if the hover styles are working).
Examine the Computed tab: With the div.block-controls element selected, go to the Computed tab in the Styles pane. Look at the computed values for:
opacity: Does it change from 0 to 1?
pointer-events: Does it change from none to auto?
transform: Does it change (e.g., from scale(0.95) to none or scale(1))?
If these properties change as described, it confirms that the CSS rules for the hover state are correctly targeting and styling the block-controls element. The reason you don't see them normally is because they are styled to be hidden (opacity: 0, pointer-events: none) until the parent is hovered.

Regarding your question about CSS rules not being applied: If you force the hover state and the computed styles don't change as expected (e.g., opacity stays at 0), then you would look in the Styles pane while the block-controls element is selected and the parent's hover state is forced. Look for rules like .group:hover .block-controls or similar selectors. If such a rule exists but its properties (like opacity: 1) are being overridden, DevTools will usually show the overridden rule struck through, indicating that a rule with higher