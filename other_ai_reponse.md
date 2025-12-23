Sidebar Truncation Fix
The sidebar tree items are not truncating because the ScrollArea component's viewport allows horizontal scrolling (or expansion) by default when content overflows. This prevents the flex-based truncation (min-w-0, truncate) from engaging, as the container simply grows to fit the text.

To fix this, we need to constrain the ScrollArea viewport to strictly inhibit horizontal overflow, forcing the children to fit within the available width and thus assume the text truncation behavior.

User Review Required
IMPORTANT

I am modifying the shared ScrollArea component to accept a new prop viewportClassName. This is a non-breaking change but extends the component API.

Proposed Changes
UI Components
[MODIFY] 
scroll-area.jsx
Update ScrollArea component to destructure viewportClassName from props.
Pass viewportClassName to ScrollAreaPrimitive.Viewport alongside the default classes.
Sidebar Views
[MODIFY] 
ExplorerView.jsx
Pass viewportClassName="overflow-x-hidden" to the ScrollArea component.
[MODIFY] 
FavoritesView.jsx
Pass viewportClassName="overflow-x-hidden" to the ScrollArea component.
[MODIFY] 
InboxView.jsx
Pass viewportClassName="overflow-x-hidden" to the ScrollArea component.
[MODIFY] 
RecentView.jsx
Pass viewportClassName="overflow-x-hidden" to the ScrollArea component.
[MODIFY] 
SearchView.jsx
Pass viewportClassName="overflow-x-hidden" to the ScrollArea component.