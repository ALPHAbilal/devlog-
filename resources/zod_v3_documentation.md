Perfect! Now I have comprehensive information from the official Zod v3 documentation. Let me provide you with a complete answer to your three questions.

## 1. **Recommended Pattern for `z.infer<>`**[1][2]

The recommended pattern is to **derive types directly from your Zod schema** using `z.infer<typeof schema>`:

```typescript
import { z } from "zod";

// Define schema ONCE as the source of truth
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

// Extract the inferred type
type User = z.infer<typeof UserSchema>;
// => { name: string; email: string; age?: number | undefined }

// Use it throughout your codebase
const user: User = {
  name: "Alice",
  email: "alice@example.com",
  age: 30,
};

// Runtime validation
const parsed = UserSchema.parse(userData);
```

**Why this matters:**
- ✅ Single source of truth (schema defines both validation + types)
- ✅ Types auto-update when schema changes
- ✅ No duplication between interfaces and schemas
- ✅ Compile-time type safety + runtime validation guarantee[3][4]

***

## 2. **z.infer<> as Source of Truth vs Separate Interfaces**[5][6]

**Best practice: Make `z.infer<>` your source of truth**[4][7]

```typescript
// ❌ AVOID: Maintaining both separately
interface UserInterface {
  name: string;
  email: string;
  age?: number;
}

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

// ^ Now you have two sources of truth - maintenance nightmare

// ✅ PREFER: Let Zod be the single source
const UserSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  age: z.number().int().positive().optional(),
});

type User = z.infer<typeof UserSchema>;
```

**When to use separate interfaces:**
Only if you're integrating with existing code or external types you don't control:

```typescript
// External type you can't modify
interface ExternalUserType {
  name: string;
  email: string;
}

// Create Zod schema that validates against it
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
}) satisfies z.ZodType<ExternalUserType>;
// ^ Using satisfies ensures type safety between schema and external type
```

***

## 3. **Handling Transforms in Inferred Types**[2]

This is critical: **Zod tracks INPUT and OUTPUT types separately**[2]

### When `.transform()` changes the type:

```typescript
// Transform: union → normalized object
const UnionSchema = z.union([
  z.object({ type: z.literal("email"), value: z.string().email() }),
  z.object({ type: z.literal("phone"), value: z.string() }),
]);

// After transform to normalized structure
const NormalizedSchema = UnionSchema.transform((input) => {
  if (input.type === "email") {
    return { kind: "email", contact: input.value };
  } else {
    return { kind: "phone", contact: input.value };
  }
});

// ✅ OUTPUT type (what z.infer returns)
type Normalized = z.infer<typeof NormalizedSchema>;
// => { kind: "email"; contact: string } | { kind: "phone"; contact: string }

// 🔍 INPUT type (what you pass to .parse())
type InputData = z.input<typeof NormalizedSchema>;
// => { type: "email"; value: string } | { type: "phone"; value: string }

// Usage:
const result = NormalizedSchema.parse({
  type: "email",
  value: "user@example.com"
}); // result type: { kind: "email"; contact: string }
```

### Key APIs for Transform Inference:

```typescript
// For transformed schemas
z.infer<typeof schema>;        // OUTPUT type (after transform)
z.input<typeof schema>;        // INPUT type (before transform)
z.output<typeof schema>;       // OUTPUT type (alternative syntax)

// Example with coercion transform
const CoercedDate = z.string().pipe(z.coerce.date());

type Input = z.input<typeof CoercedDate>;   // string
type Output = z.infer<typeof CoercedDate>;  // Date
```

### Practical Example: Union → Object Normalization

```typescript
// Complex transform pattern
const APIResponseSchema = z.union([
  z.object({ 
    success: z.literal(true), 
    data: z.any() 
  }),
  z.object({ 
    success: z.literal(false), 
    error: z.string() 
  }),
]).transform((input) => {
  // Normalize union to standard format
  if (input.success) {
    return { 
      ok: true, 
      payload: input.data 
    } as const;
  } else {
    return { 
      ok: false, 
      message: input.error 
    } as const;
  }
});

// Inferred output type
type APIResponse = z.infer<typeof APIResponseSchema>;
// => 
// | { readonly ok: true; readonly payload: any }
// | { readonly ok: false; readonly message: string }

// Parse and use
const response = APIResponseSchema.parse(apiData);
if (response.ok) {
  console.log(response.payload); // ✅ TypeScript knows this exists
}
```

***

## Summary Table[2]

| Aspect | Recommendation | Code |
|--------|---------------|------|
| **Type Source** | Zod schema as single source | `type User = z.infer<typeof UserSchema>` |
| **Separate Interfaces** | ❌ Avoid duplication | Only when integrating external types |
| **Basic Types** | Use `z.infer<>` | Returns output type (most common) |
| **Transformed Schemas** | Use `z.input<>` for input | Distinguishes pre/post-transform types |
| **Getting Input Type** | Use `z.input<typeof schema>` | For generic functions handling raw data |
| **Verification** | Use `satisfies z.ZodType<T>` | Ensure schema matches external types |

**Bottom line:** Zod's philosophy is "declare once, infer types and validation automatically." This eliminates the maintenance burden of keeping interfaces and schemas in sync and is explicitly the recommended pattern from Zod's official documentation.[1][4][2]

[1](https://zod.dev)
[2](https://zod.dev/basics)
[3](https://betterstack.com/community/guides/scaling-nodejs/zod-explained/)
[4](https://stevekinney.com/courses/full-stack-typescript/structuring-zod-schemas-efficiently)
[5](https://github.com/colinhacks/zod/issues/2807)
[6](https://www.reddit.com/r/typescript/comments/10f8kah/is_using_zod_as_the_primary_source_of_truth_for/)
[7](https://www.sather.ws/writing/zod-parse-transforms)
[8](https://drops.dagstuhl.de/opus/volltexte/2015/5218/pdf/8.pdf)
[9](https://zenodo.org/record/6996280/files/jucs_article_27933.pdf)
[10](http://arxiv.org/pdf/2310.00673.pdf)
[11](https://www.aclweb.org/anthology/D18-1231.pdf)
[12](https://arxiv.org/pdf/2208.05361.pdf)
[13](http://arxiv.org/pdf/2406.15676.pdf)
[14](https://dl.acm.org/doi/pdf/10.1145/3617232.3624852)
[15](https://arxiv.org/pdf/2208.09189.pdf)
[16](https://stackoverflow.com/questions/71782572/zod-create-a-schema-using-an-existing-type)
[17](https://www.reddit.com/r/typescript/comments/15a8n6a/question_about_zod_inferred_types/)
[18](https://www.youtube.com/watch?v=JZjUv_qFtvM)
[19](https://stevekinney.com/courses/full-stack-typescript/advanced-schema-design-with-zod)
[20](https://dev.to/emiroberti/zod-for-typescript-schema-validation-a-comprehensive-guide-4n9k)
[21](https://github.com/colinhacks/zod)
[22](https://github.com/colinhacks/zod/issues/397)
[23](https://v3.zod.dev)
[24](https://stackoverflow.com/questions/75886482/check-zod-types-are-equivalent-to-a-typescript-interface)
[25](https://reliasoftware.com/blog/zod-schema-validation-react-tutorial)
[26](https://www.telerik.com/blogs/zod-typescript-schema-validation-made-easy)
[27](https://github.com/colinhacks/zod/issues/5459)
[28](https://dev.to/sam_th/zod-vs-typescript-interfaces-why-you-need-runtime-validation-n2i)