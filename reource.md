Yes, for your **document editor use case with dynamic content**, there are **better alternatives** than TanStack Virtual. Based on your specific problem (components with internal animations/state causing height oscillations), here are the recommended solutions:

## Best Solution: React Virtuoso

**React Virtuoso** is specifically designed for your exact use case and is the industry standard for document editors with dynamic content.[1][2]

### Why Virtuoso is Perfect for Your Problem

**Built for Dynamic Heights**[2][1]
- Automatically handles components that change size after mount
- No oscillation issues with expanding/collapsing components
- ResizeObserver is intelligently debounced
- Handles animations and transitions gracefully

**Document Editor Optimized**[1]
- Used by Notion-like applications[3]
- Handles rich text editors (Lexical, ProseMirror, TipTap)[4][5]
- Works seamlessly with interactive blocks
- Supports components with internal state

**Zero Configuration for Dynamic Content**[2]
```jsx
import { Virtuoso } from 'react-virtuoso';

function DocumentEditor({ blocks }) {
  return (
    <Virtuoso
      data={blocks}
      itemContent={(index, block) => (
        <FileTreeBlock 
          data={block}
          // No need for data-index or measureElement!
          // Virtuoso handles everything automatically
        />
      )}
    />
  );
}
```

### Key Differences from TanStack Virtual

| Feature | TanStack Virtual | React Virtuoso |
|---------|------------------|----------------|
| **Dynamic Heights** | Manual with measureElement[6] | Automatic, built-in[1][2] |
| **ResizeObserver** | Aggressive, causes loops[7] | Intelligent debouncing[1] |
| **Animations** | Causes oscillations | Handles gracefully[1] |
| **Learning Curve** | Steep, headless approach | Simple, opinionated[2] |
| **Document Editors** | Not designed for this[6] | Primary use case[1][2] |
| **Performance** | Need React.memo everywhere[8] | Optimized out of box[1] |

## Alternative Solutions

### 2. React Window with Custom Logic (Not Recommended)

If you must stick with virtualization libraries, react-window requires extensive customization for your use case:[9][10]

```jsx
// Complex workaround needed
const [heights, setHeights] = useState({});
const listRef = useRef();

const getItemSize = (index) => heights[index] || 299;

// Need manual debouncing to prevent loops
const debouncedResize = useDebouncedCallback((index, size) => {
  setHeights(prev => ({ ...prev, [index]: size }));
  listRef.current?.resetAfterIndex(index);
}, 100);
```

This approach is **fragile** and still prone to issues.[10][9]

### 3. No Virtualization for Document Editors (Recommended Alternative)

Many modern document editors **don't use virtualization at all**:[11][4]

**Why No Virtualization Works**[11][4]
- Modern browsers handle 1000+ DOM nodes efficiently
- Document editors rarely exceed this threshold in viewport
- Simpler code, no measurement issues
- Better for SEO and accessibility

**Optimization Strategies Instead**[4][11]
```jsx
// Use pagination/infinite scroll instead
function DocumentEditor({ blocks }) {
  const visibleBlocks = useInfiniteScroll(blocks, {
    threshold: 100, // Load more when near end
    initialLoad: 50  // Start with 50 blocks
  });

  return (
    <div>
      {visibleBlocks.map(block => (
        <FileTreeBlock 
          key={block.id}
          data={block}
          // No virtualization complexity!
        />
      ))}
    </div>
  );
}
```

### 4. Lexical Editor with Built-in Virtualization

If you're building a rich text editor specifically, **Lexical** has built-in optimization:[5][4]

```jsx
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';

// Lexical handles large documents internally
// No external virtualization needed
<LexicalComposer initialConfig={config}>
  <RichTextPlugin
    contentEditable={<ContentEditable />}
    placeholder={<Placeholder />}
  />
</LexicalComposer>
```

Lexical's internal optimization handles:
- Lazy rendering of nodes[4]
- Efficient DOM updates[4]
- No height measurement issues[4]

## Recommended Action Plan

### For Document Editors (Your Use Case)

**Option 1: Use React Virtuoso** (Recommended)[1][2]
```bash
npm install react-virtuoso
```

```jsx
import { Virtuoso } from 'react-virtuoso';

function DocumentEditor({ blocks }) {
  return (
    <Virtuoso
      style={{ height: '100vh' }}
      data={blocks}
      itemContent={(index, block) => (
        <FileTreeBlock data={block} />
      )}
      increaseViewportBy={{ top: 200, bottom: 600 }}
    />
  );
}
```

**Benefits**:
- Solves your oscillation problem completely[1]
- No manual height tracking needed[2][1]
- Works with animations and internal state[1]
- Battle-tested in production editors[1]

**Option 2: Remove Virtualization** (Simple Alternative)[11]
```jsx
// For < 500 blocks in viewport
function DocumentEditor({ blocks }) {
  const [visibleBlocks, setVisibleBlocks] = useState(blocks.slice(0, 50));
  
  useInfiniteScroll(() => {
    setVisibleBlocks(prev => [...prev, ...blocks.slice(prev.length, prev.length + 50)]);
  });

  return (
    <div>
      {visibleBlocks.map(block => (
        <FileTreeBlock key={block.id} data={block} />
      ))}
    </div>
  );
}
```

### Why TanStack Virtual Isn't Right for You

TanStack Virtual is designed for:[6][12]
- **Static content** (tweets, comments, feeds)
- **Server-rendered lists** (data doesn't change)
- **Read-only virtualization** (tables, grids)

It's **NOT** designed for:[7][6]
- Rich text editors with dynamic content
- Interactive blocks with internal state
- Animated components that change height
- Document editing experiences

## Production Examples

**Using React Virtuoso**:[2][1]
- Notion clones[3]
- Collaborative editors[4]
- Document management systems[1]

**Not Using Virtualization**:[11][4]
- Google Docs (uses pagination)
- Medium editor (lazy loads)
- Lexical-based editors[5][4]

## Final Recommendation

**Switch to React Virtuoso**. It will solve your height oscillation problem immediately because it's specifically designed for dynamic content in document editors. The API is simpler, it handles ResizeObserver intelligently, and it's battle-tested in production applications similar to yours.[2][1]

If React Virtuoso doesn't work for some reason, **remove virtualization entirely** and use simple infinite scroll for better performance and developer experience.[11]

[1](https://virtuoso.dev)
[2](https://github.com/petyosi/react-virtuoso)
[3](https://github.com/mohammedmohsin203/Notion-Clone-7)
[4](https://mortenson.coffee/blog/collaborative-text-editing-scratch-lexical)
[5](https://liveblocks.io/docs/ready-made-features/multiplayer-editing/text-editor/lexical)
[6](https://github.com/TanStack/virtual/issues/659)
[7](https://github.com/TanStack/virtual/issues/531)
[8](https://github.com/tannerlinsley/react-virtual/issues/139)
[9](https://stackoverflow.com/questions/63083570/react-virtualized-infinite-loop-of-scrollbar-disappearing-reappearing)
[10](https://stackoverflow.com/questions/40988410/react-virtualized-autosizer-height-issue)
[11](https://froala.com/blog/general/how-to-optimize-the-load-time-of-your-rich-text-editor/)
[12](https://tanstack.com/virtual/latest/docs/api/virtualizer)
[13](https://academic.oup.com/bioinformatics/article/26/7/966/212410)
[14](http://thesai.org/Publications/ViewPaper?Volume=15&Issue=4&Code=IJACSA&SerialNo=35)
[15](http://ijarsct.co.in/Paper15666.pdf)
[16](http://link.springer.com/10.1007/s11554-020-01048-w)
[17](https://jcheminf.biomedcentral.com/articles/10.1186/1758-2946-4-17)
[18](https://www.semanticscholar.org/paper/9ee5b0fbfb59f6d05c5ba07c4582b7afbd253dfe)
[19](https://eajournals.org/ijliss/vol11-issue-3-2025/integration-of-ai-chatbot-into-librarys-operations-opportunities-or-threats-to-librarians-role/)
[20](https://muse.jhu.edu/article/572803)
[21](http://portal.acm.org/citation.cfm?doid=147001.147008)
[22](https://nbpublish.com/library_read_article.php?id=39547)
[23](https://arxiv.org/pdf/2401.15510.pdf)
[24](http://arxiv.org/pdf/2111.12785.pdf)
[25](https://ejournals.bc.edu/index.php/ital/article/download/3219/2832)
[26](https://pmc.ncbi.nlm.nih.gov/articles/PMC11627126/)
[27](http://arxiv.org/pdf/2407.03027.pdf)
[28](https://arxiv.org/html/2403.13711v1)
[29](https://arxiv.org/pdf/2312.16973.pdf)
[30](http://article.sciencepublishinggroup.com/pdf/10.11648.j.iotcc.20170504.12.pdf)
[31](https://www.nutrient.io/guides/document-authoring/)
[32](https://github.com/Xta1neR/Live_Text_Editor)
[33](https://www.leadtools.com/sdk/document/document-editor-html5)
[34](https://apryse.com/capabilities/page-manipulation)
[35](https://get.almanac.io/blog/open-source-document-editor)
[36](https://demos.devexpress.com/ASPNetCore/Demo/RichEdit/DynamicContent/)
[37](https://www.syncfusion.com/document-sdk)
[38](https://www.youtube.com/watch?v=ZgstesimYN0)
[39](https://ijsrem.com/download/codox-a-real-time-collaborative-document-editing-platform-2/)
[40](https://www.tandfonline.com/doi/full/10.1080/10286632.2022.2137160)
[41](http://www.liverpooluniversitypress.co.uk/doi/10.1093/fs/knv069)
[42](https://www.bloomsburycollections.com/monograph?docid=b-9781350353596)
[43](https://muse.jhu.edu/article/930067)
[44](http://modernhistory.ru/f/stelmak_3.pdf)
[45](https://onlinelibrary.wiley.com/doi/10.1111/all.14725)
[46](https://scholarlypublishingcollective.org/austrian-american-history/article/6/1/44/351765/To-Realize-in-America-What-Has-Become-Impossible)
[47](https://www.semanticscholar.org/paper/3a91ef7a434fb8cbcaf64813663b48b97e13a811)
[48](https://onlinelibrary.wiley.com/doi/10.1111/pai.13918)
[49](https://arxiv.org/html/2410.16472v1)
[50](https://arxiv.org/pdf/2501.17887.pdf)
[51](https://arxiv.org/html/2309.15337)
[52](https://arxiv.org/pdf/2311.18057.pdf)
[53](https://arxiv.org/html/2410.15504v1)
[54](https://www.jstatsoft.org/index.php/jss/article/view/v046i03/v46i03.pdf)
[55](http://arxiv.org/pdf/2408.09869.pdf)
[56](https://codesandbox.io/s/react-virtuoso-example-ww2nh6)
[57](https://github.com/radishmouse/react-document-editor)
[58](https://www.npmjs.com/package/@virtuoso.dev/react-monaco-editor)
[59](https://www.youtube.com/watch?v=LsQpSGQ-sq4)
[60](https://discuss.codemirror.net/t/improve-scroll-performance-tradeoff/8825)