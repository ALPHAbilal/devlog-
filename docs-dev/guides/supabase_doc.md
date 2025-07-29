TITLE: Create PostgreSQL RLS Policy for User-Specific Rows
DESCRIPTION: This SQL snippet defines a Row Level Security (RLS) policy named `todo_select_policy` on the `todos` table. It allows users to select only their own rows by checking if the authenticated user's ID (`auth.uid()`) matches the `user_id` column in the `todos` table. This ensures data privacy and security by restricting access to individual rows based on user identity.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2021-12-01-realtime-row-level-security-in-postgresql.mdx#_snippet_0

LANGUAGE: sql
CODE:
```
create policy todo_select_policy
    on todos for select
    using ( (select auth.uid()) = user_id );
```

----------------------------------------

TITLE: Create SELECT policy for individual user data
DESCRIPTION: Example of a Postgres RLS policy that allows users to view only their own records in a 'todos' table. It uses `auth.uid()` to match the current user's ID with the `user_id` column.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/row-level-security.mdx#_snippet_1

LANGUAGE: SQL
CODE:
```
create policy "Individuals can view their own todos."
on todos for select
using ( (select auth.uid()) = user_id );
```

----------------------------------------

TITLE: Enable Row Level Security for a table
DESCRIPTION: SQL command to enable Row Level Security on a specified table. Once enabled, no data will be accessible via the API using the public `anon` key until policies are created.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/row-level-security.mdx#_snippet_0

LANGUAGE: SQL
CODE:
```
alter table "table_name" enable row level security;
```

----------------------------------------

TITLE: Create PostgreSQL Function for Vector Similarity Search
DESCRIPTION: This SQL function, `match_documents`, enables similarity search on a `documents` table by comparing a `query_embedding` to existing document embeddings. It calculates similarity using the cosine distance operator (`<=>`), filters results based on a `match_threshold`, and limits the number of returned documents by `match_count`. This approach is necessary because PostgREST does not directly support `pgvector` similarity operators.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/vector-columns.mdx#_snippet_3

LANGUAGE: sql
CODE:
```
create or replace function match_documents (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  body text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.title,
    documents.body,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by (documents.embedding <=> query_embedding) asc
  limit match_count;
$$;
```

----------------------------------------

TITLE: Supabase Database Schema and Policies for Profiles
DESCRIPTION: SQL script to define the `profiles` table, including columns for user ID, update timestamp, username, avatar URL, and website. It sets up Row Level Security (RLS) policies to control access for viewing, inserting, and updating profiles. Additionally, it configures Supabase Realtime for the `profiles` table and creates a storage bucket named 'avatars' with public access policies.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/nuxt3-user-management/README.md#_snippet_1

LANGUAGE: sql
CODE:
```
-- Create a table for public "profiles"
create table profiles (
  id uuid references auth.users not null,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,

  primary key (id),
  unique(username),
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;

-- Set up Storage!
insert into storage.buckets (id, name)
values ('avatars', 'avatars');

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );
```

----------------------------------------

TITLE: Supabase Auth: Sign in with Email Magic Link
DESCRIPTION: Demonstrates how to initiate a passwordless login using a Magic Link sent to a user's email address. The `signInWithOtp` method is used, which sends a Magic Link by default. Options like `shouldCreateUser` (to prevent automatic sign-up) and `emailRedirectTo` (for post-login redirection) can be configured.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/auth-email-passwordless.mdx#_snippet_0

LANGUAGE: JavaScript
CODE:
```
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('url', 'anonKey')

async function signInWithEmail() {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'valid.email@supabase.io',
    options: {
      // set this to false if you do not want the user to be automatically signed up
      shouldCreateUser: false,
      emailRedirectTo: 'https://example.com/welcome',
    },
  })
}
```

LANGUAGE: TypeScript
CODE:
```
import { makeRedirectUri } from 'expo-auth-session'

const redirectTo = makeRedirectUri()

const { error } = await supabase.auth.signInWithOtp({
  email: 'valid.email@supabase.io',
  options: {
    emailRedirectTo: redirectTo,
  },
})
```

LANGUAGE: Dart
CODE:
```
Future<void> signInWithEmail() async {
  final AuthResponse res = await supabase.auth.signinwithotp(email: 'valid.email@supabase.io');
}
```

LANGUAGE: Swift
CODE:
```
try await supabase.auth.signInWithOTP(
  email: "valid.email@supabase.io",
  redirectTo: URL(string: "https://example.com/welcome"),
  // set this to false if you do not want the user to be automatically signed up
  shouldCreateUser: false
)
```

LANGUAGE: Kotlin
CODE:
```
suspend fun signInWithEmail() {
	supabase.auth.signInWith(OTP) {
		email = "valid.email@supabase.io"
	}
}
```

LANGUAGE: Python
CODE:
```
response = supabase.auth.sign_in_with_otp({
  'email': 'valid.email@supabase.io',
  'options': {
    # set this to false if you do not want the user to be automatically signed up
    'should_create_user': False,
    'email_redirect_to': 'https://example.com/welcome',
  },
})
```

----------------------------------------

TITLE: Create Supabase User Profile Table and Auth Trigger with Security Definer
DESCRIPTION: This comprehensive SQL example demonstrates how to set up a `profiles` table and an associated trigger on `auth.users` that automatically populates profile data for new users. The key is the `security definer` clause on the `handle_new_user` function, which allows the trigger to operate with the privileges of the function's creator (e.g., `postgres` role), thereby preventing permission errors when interacting with tables outside the `auth` schema.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/troubleshooting/dashboard-errors-when-managing-users-N1ls4A.mdx#_snippet_1

LANGUAGE: SQL
CODE:
```
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

----------------------------------------

TITLE: Postgres Default Data Types Reference
DESCRIPTION: A comprehensive list of default data types available in PostgreSQL, including their names, common aliases, and a brief description of their purpose and characteristics. These types can be used when defining columns in a Postgres database.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/tables.mdx#_snippet_1

LANGUAGE: APIDOC
CODE:
```
Postgres Data Types:
  - Name: bigint
    Aliases: int8
    Description: signed eight-byte integer
  - Name: bigserial
    Aliases: serial8
    Description: autoincrementing eight-byte integer
  - Name: bit
    Aliases: 
    Description: fixed-length bit string
  - Name: bit varying
    Aliases: varbit
    Description: variable-length bit string
  - Name: boolean
    Aliases: bool
    Description: logical Boolean (true/false)
  - Name: box
    Aliases: 
    Description: rectangular box on a plane
  - Name: bytea
    Aliases: 
    Description: binary data (“byte array”)
  - Name: character
    Aliases: char
    Description: fixed-length character string
  - Name: character varying
    Aliases: varchar
    Description: variable-length character string
  - Name: cidr
    Aliases: 
    Description: IPv4 or IPv6 network address
  - Name: circle
    Aliases: 
    Description: circle on a plane
  - Name: date
    Aliases: 
    Description: calendar date (year, month, day)
  - Name: double precision
    Aliases: float8
    Description: double precision floating-point number (8 bytes)
  - Name: inet
    Aliases: 
    Description: IPv4 or IPv6 host address
  - Name: integer
    Aliases: int, int4
    Description: signed four-byte integer
  - Name: interval [ fields ]
    Aliases: 
    Description: time span
  - Name: json
    Aliases: 
    Description: textual JSON data
  - Name: jsonb
    Aliases: 
    Description: binary JSON data, decomposed
  - Name: line
    Aliases: 
    Description: infinite line on a plane
  - Name: lseg
    Aliases: 
    Description: line segment on a plane
  - Name: macaddr
    Aliases: 
    Description: MAC (Media Access Control) address
  - Name: macaddr8
    Aliases: 
    Description: MAC (Media Access Control) address (EUI-64 format)
  - Name: money
    Aliases: 
    Description: currency amount
  - Name: numeric
    Aliases: decimal
    Description: exact numeric of selectable precision
  - Name: path
    Aliases: 
    Description: geometric path on a plane
  - Name: pg_lsn
    Aliases: 
    Description: Postgres Log Sequence Number
  - Name: pg_snapshot
    Aliases: 
    Description: user-level transaction ID snapshot
  - Name: point
    Aliases: 
    Description: geometric point on a plane
  - Name: polygon
    Aliases: 
    Description: closed geometric path on a plane
  - Name: real
    Aliases: float4
    Description: single precision floating-point number (4 bytes)
  - Name: smallint
    Aliases: int2
    Description: signed two-byte integer
  - Name: smallserial
    Aliases: serial2
    Description: autoincrementing two-byte integer
  - Name: serial
    Aliases: serial4
    Description: autoincrementing four-byte integer
  - Name: text
    Aliases: 
    Description: variable-length character string
  - Name: time [ without time zone ]
    Aliases: 
    Description: time of day (no time zone)
```

----------------------------------------

TITLE: Migrate `withApiAuth` to `createPagesServerClient` for Next.js API Routes
DESCRIPTION: The `withApiAuth` higher-order function is deprecated. This snippet demonstrates how to update Next.js API routes by replacing `withApiAuth` with `createPagesServerClient`. The new approach involves explicitly creating an authenticated Supabase client within the `NextApiHandler` and manually checking for user sessions before performing RLS-enabled queries.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/auth-helpers/nextjs-pages.mdx#_snippet_15

LANGUAGE: tsx
CODE:
```
import { withApiAuth } from '@supabase/auth-helpers-nextjs'

export default withApiAuth(async function ProtectedRoute(req, res, supabase) {
  // Run queries with RLS on the server
  const { data } = await supabase.from('test').select('*')
  res.json(data)
})
```

LANGUAGE: tsx
CODE:
```
import { NextApiHandler } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const ProtectedRoute: NextApiHandler = async (req, res) => {
  // Create authenticated Supabase Client
  const supabase = createPagesServerClient({ req, res })
  // Check if we have a session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user)
    return res.status(401).json({
      error: 'not_authenticated',
      description: 'The user does not have an active session or is not authenticated',
    })

  // Run queries with RLS on the server
  const { data } = await supabase.from('test').select('*')
  res.json(data)
}

export default ProtectedRoute
```

----------------------------------------

TITLE: Supabase Edge Function for Similarity Search with OpenAI
DESCRIPTION: This Edge Function handles incoming search queries, generates a one-time OpenAI embedding for the query, and then calls a Supabase RPC function ('match_documents') to find and return relevant documents based on vector similarity. It also includes CORS handling.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-02-03-openai-embeddings-postgres-vector.mdx#_snippet_5

LANGUAGE: TypeScript
CODE:
```
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'
import 'https://deno.land/x/xhr@0.2.1/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'
import { supabaseClient } from './lib/supabase'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Search query is passed in request payload
  const { query } = await req.json()

  // OpenAI recommends replacing newlines with spaces for best results
  const input = query.replace(/\n/g, ' ')

  const configuration = new Configuration({ apiKey: '<YOUR_OPENAI_API_KEY>' })
  const openai = new OpenAIApi(configuration)

  // Generate a one-time embedding for the query itself
  const embeddingResponse = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input,
  })

  const [{ embedding }] = embeddingResponse.data.data

  // In production we should handle possible errors
  const { data: documents } = await supabaseClient.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.78, // Choose an appropriate threshold for your data
    match_count: 10, // Choose the number of matches
  })

  return new Response(JSON.stringify(documents), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

----------------------------------------

TITLE: Disable Next.js Caching for Dynamic Data
DESCRIPTION: These Next.js page configurations prevent data caching, ensuring fresh data is fetched on every request. This is particularly useful when dealing with frequently changing data or Row Level Security (RLS) updates that might not immediately reflect due to Next.js's default caching behavior.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/troubleshooting/nextjs-1314-stale-data-when-changing-rls-or-table-data-85b8oQ.mdx#_snippet_0

LANGUAGE: JavaScript
CODE:
```
export const dynamic = 'force-dynamic'; // no caching
```

LANGUAGE: JavaScript
CODE:
```
export const fetchCache = 'force-no-store' // to page.js
```

LANGUAGE: JavaScript
CODE:
```
export const revalidate = 0
```

----------------------------------------

TITLE: Initialize Supabase Client with URL and Anon Key
DESCRIPTION: This code demonstrates how to initialize the Supabase client using your project's URL and anonymous public key. These credentials are required to connect your application to your Supabase database.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2021-03-11-using-supabase-replit.mdx#_snippet_1

LANGUAGE: JavaScript
CODE:
```
const supabase = createClient(
  'https://ajsstlnzcmdmzbtcgbbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
)
```

----------------------------------------

TITLE: Create triggers for embedding jobs on insert/update in PostgreSQL
DESCRIPTION: Sets up PostgreSQL triggers to enqueue embedding jobs whenever content is inserted or updated in the `documents` table. These triggers use the `util.queue_embeddings` function to queue the jobs, ensuring that embeddings are automatically generated for new and modified content.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/automatic-embeddings.mdx#_snippet_15

LANGUAGE: SQL
CODE:
```
-- Trigger for insert events
create trigger embed_documents_on_insert
  after insert
  on documents
  for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');

-- Trigger for update events
create trigger embed_documents_on_update
  after update of title, content -- must match the columns in embedding_input()
  on documents
  for each row
  execute function util.queue_embeddings('embedding_input', 'embedding');
```

----------------------------------------

TITLE: Automating Supabase Type Updates with GitHub Actions Workflow (YAML)
DESCRIPTION: This YAML snippet defines a GitHub Actions workflow that runs daily to automatically update Supabase database types. It checks out the repository, sets up Node.js, runs the `update-types` script defined in `package.json`, checks for file changes, commits any new type definitions, and pushes them back to the repository. It requires `SUPABASE_ACCESS_TOKEN` and `PROJECT_REF` as environment variables.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/api/rest/generating-types.mdx#_snippet_17

LANGUAGE: yaml
CODE:
```
name: Update database types

on:
  schedule:
    # sets the action to run daily. You can modify this to run the action more or less frequently
    - cron: '0 0 * * *'

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
      PROJECT_REF: <your-project-id>
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm run update-types
      - name: check for file changes
        id: git_status
        run: |
          echo "status=$(git status -s)" >> $GITHUB_OUTPUT
      - name: Commit files
        if: ${{contains(steps.git_status.outputs.status, ' ')}}
        run: |
          git add database.types.ts
          git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git commit -m "Update database types" -a
      - name: Push changes
        if: ${{contains(steps.git_status.outputs.status, ' ')}}
        uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ github.ref }}
```

----------------------------------------

TITLE: Implement Flutter Account Page with Supabase Integration
DESCRIPTION: This Dart code defines the `AccountPage` widget, which manages user profiles in a Flutter application using Supabase. It includes methods for fetching user profiles (`_getProfile`), updating profile details (`_updateProfile`), signing out (`_signOut`), and handling avatar uploads (`_onUpload`). The page displays user information, allows editing, and updates the avatar URL in the Supabase 'profiles' table upon image upload.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/getting-started/tutorials/with-flutter.mdx#_snippet_10

LANGUAGE: dart
CODE:
```
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:supabase_quickstart/components/avatar.dart';
import 'package:supabase_quickstart/main.dart';
import 'package:supabase_quickstart/pages/login_page.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  final _usernameController = TextEditingController();
  final _websiteController = TextEditingController();

  String? _avatarUrl;
  var _loading = true;

  /// Called once a user id is received within `onAuthenticated()`
  Future<void> _getProfile() async {
    setState(() {
      _loading = true;
    });

    try {
      final userId = supabase.auth.currentSession!.user.id;
      final data =
          await supabase.from('profiles').select().eq('id', userId).single();
      _usernameController.text = (data['username'] ?? '') as String;
      _websiteController.text = (data['website'] ?? '') as String;
      _avatarUrl = (data['avatar_url'] ?? '') as String;
    } on PostgrestException catch (error) {
      if (mounted) context.showSnackBar(error.message, isError: true);
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Unexpected error occurred', isError: true);
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  /// Called when user taps `Update` button
  Future<void> _updateProfile() async {
    setState(() {
      _loading = true;
    });
    final userName = _usernameController.text.trim();
    final website = _websiteController.text.trim();
    final user = supabase.auth.currentUser;
    final updates = {
      'id': user!.id,
      'username': userName,
      'website': website,
      'updated_at': DateTime.now().toIso8601String(),
    };
    try {
      await supabase.from('profiles').upsert(updates);
      if (mounted) context.showSnackBar('Successfully updated profile!');
    } on PostgrestException catch (error) {
      if (mounted) context.showSnackBar(error.message, isError: true);
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Unexpected error occurred', isError: true);
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _signOut() async {
    try {
      await supabase.auth.signOut();
    } on AuthException catch (error) {
      if (mounted) context.showSnackBar(error.message, isError: true);
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Unexpected error occurred', isError: true);
      }
    } finally {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginPage()),
        );
      }
    }
  }

  /// Called when image has been uploaded to Supabase storage from within Avatar widget
  Future<void> _onUpload(String imageUrl) async {
    try {
      final userId = supabase.auth.currentUser!.id;
      await supabase.from('profiles').upsert({
        'id': userId,
        'avatar_url': imageUrl,
      });
      if (mounted) {
        const SnackBar(
          content: Text('Updated your profile image!'),
        );
      }
    } on PostgrestException catch (error) {
      if (mounted) context.showSnackBar(error.message, isError: true);
    } catch (error) {
      if (mounted) {
        context.showSnackBar('Unexpected error occurred', isError: true);
      }
    }
    if (!mounted) {
      return;
    }

    setState(() {
      _avatarUrl = imageUrl;
    });
  }

  @override
  void initState() {
    super.initState();
    _getProfile();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
        children: [
          Avatar(
            imageUrl: _avatarUrl,
            onUpload: _onUpload,
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _usernameController,
            decoration: const InputDecoration(labelText: 'User Name'),
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _websiteController,
            decoration: const InputDecoration(labelText: 'Website'),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _loading ? null : _updateProfile,

```

----------------------------------------

TITLE: Perform Metadata Filtered Similarity Search in LangChain with Supabase
DESCRIPTION: This JavaScript example extends the basic usage by demonstrating how to apply metadata filtering during a similarity search. It uses the `match_documents` Postgres function's filter parameter to narrow down search results based on specified JSONB metadata values, such as `user_id`.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/langchain.mdx#_snippet_2

LANGUAGE: js
CODE:
```
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { createClient } from '@supabase/supabase-js'

// First, follow set-up instructions above

const privateKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!privateKey) throw new Error(`Expected env var SUPABASE_SERVICE_ROLE_KEY`)

const url = process.env.SUPABASE_URL
if (!url) throw new Error(`Expected env var SUPABASE_URL`)

export const run = async () => {
  const client = createClient(url, privateKey)

  const vectorStore = await SupabaseVectorStore.fromTexts(
    ['Hello world', 'Hello world', 'Hello world'],
    [{ user_id: 2 }, { user_id: 1 }, { user_id: 3 }],
    new OpenAIEmbeddings(),
    {
      client,
      tableName: 'documents',
      queryName: 'match_documents',
    }
  )

  const result = await vectorStore.similaritySearch('Hello world', 1, {
    user_id: 3,
  })

  console.log(result)
}
```

----------------------------------------

TITLE: Implement Supabase Authentication Middleware in Next.js
DESCRIPTION: This code snippet provides the implementation for a Next.js middleware designed to handle Supabase authentication. Its primary functions include refreshing expired authentication tokens by calling `supabase.auth.getUser()`, and then propagating these refreshed tokens to both Server Components (via `request.cookies.set`) and the user's browser (via `response.cookies.set`). The `config.matcher` is used to specify paths where the middleware should run, optimizing performance. A critical security warning is highlighted: always use `supabase.auth.getUser()` for protecting pages and user data, and never rely on `supabase.auth.getSession()` in server-side code like middleware, as it does not guarantee token revalidation. The snippet also includes important guidelines on the correct handling of `supabaseResponse` and the placement of `auth.getUser()` calls to prevent session issues.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/server-side/nextjs.mdx#_snippet_3

LANGUAGE: TypeScript
CODE:
```
import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
```

LANGUAGE: TypeScript
CODE:
```
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
```

----------------------------------------

TITLE: Optimize Supabase RLS Policy with Wrapped SQL Function
DESCRIPTION: This snippet demonstrates how to improve the performance of Row-Level Security (RLS) policies in PostgreSQL, particularly with Supabase's `auth.uid()` function. By wrapping the function call in a `SELECT` statement within the `USING` clause of a `CREATE POLICY` statement, the Postgres optimizer can run an `initPlan` and cache the function's result per-statement, avoiding repeated execution for each row. This technique is effective for JWT functions and `security definer` functions, but only when the function's result does not depend on row data.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/row-level-security.mdx#_snippet_16

LANGUAGE: SQL
CODE:
```
create policy "rls_test_select" on test_table
to authenticated
using ( auth.uid() = user_id );
```

LANGUAGE: SQL
CODE:
```
create policy "rls_test_select" on test_table
to authenticated
using ( (select auth.uid()) = user_id );
```

----------------------------------------

TITLE: Initialize Supabase client with generated types
DESCRIPTION: Shows how to import and apply the generated `Database` types when initializing the Supabase client. This enables type-safe queries, as illustrated by selecting data from the 'messages' table with compile-time type checking.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2022-08-16-supabase-js-v2.mdx#_snippet_1

LANGUAGE: tsx
CODE:
```
import type { Database } from './DatabaseDefinitions'

const supabase = createClient<Database>(SUPABASE_URL, ANON_KEY)

const { data } = await supabase.from('messages').select().match({ id: 1 })
```

----------------------------------------

TITLE: Start the local Supabase stack
DESCRIPTION: Start the Supabase services locally on your machine. This command spins up the necessary containers for your local Postgres database, Auth, Storage, and other Supabase features. Requires a Docker-compatible container runtime.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/local-development.mdx#_snippet_2

LANGUAGE: sh
CODE:
```
npx supabase start
```

LANGUAGE: sh
CODE:
```
yarn supabase start
```

LANGUAGE: sh
CODE:
```
pnpx supabase start
```

LANGUAGE: sh
CODE:
```
supabase start
```

----------------------------------------

TITLE: Implementing AI-Powered Filter Generation API with TypeScript
DESCRIPTION: This TypeScript code defines an API endpoint (POST) that uses the AI SDK to generate complex filter groups from natural language prompts. It leverages Zod for robust schema validation of both input filter properties and the generated filter structure, including nested filter groups. The endpoint validates generated property names and operators against predefined properties, ensuring data integrity and preventing invalid queries.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/design-system/content/docs/fragments/filter-bar.mdx#_snippet_6

LANGUAGE: TypeScript
CODE:
```
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// Define schemas for validation
const FilterProperty = z.object({
  label: z.string(),
  name: z.string(),
  type: z.enum(['string', 'number', 'date', 'boolean']),
  options: z.array(z.string()).optional(),
  operators: z.array(z.string()).optional()
})

const FilterCondition = z.object({
  propertyName: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  operator: z.string()
})

type FilterGroupType = {
  logicalOperator: 'AND' | 'OR'
  conditions: Array<z.infer<typeof FilterCondition> | FilterGroupType>
}

const FilterGroup: z.ZodType<FilterGroupType> = z.lazy(() =>
  z.object({
    logicalOperator: z.enum(['AND', 'OR']),
    conditions: z.array(z.union([FilterCondition, FilterGroup]))
  })
)

export async function POST(req: Request) {
  const { prompt, filterProperties } = await req.json()
  const filterPropertiesString = JSON.stringify(filterProperties)

  try {
    const { object } = await generateObject({
      model: openai('gpt-4-mini'),
      schema: FilterGroup,
      prompt: `Generate a filter group based on the following prompt: "${prompt}". 
              Use only these filter properties: ${filterPropertiesString}. 
              Each property has its own set of valid operators defined in the operators field. 
              Return a filter group with a logical operator ('AND'/'OR') and an array of conditions. 
              Each condition can be either a filter condition or another filter group. 
              Filter conditions should have the structure: { propertyName: string, value: string | number | boolean | null, operator: string }. 
              Ensure that the generated filters use only the provided property names and their corresponding operators.`
    })

    // Validate that all propertyNames exist in filterProperties
    const validatePropertyNames = (group: FilterGroupType): boolean => {
      return group.conditions.every((condition) => {
        if ('logicalOperator' in condition) {
          return validatePropertyNames(condition as FilterGroupType)
        }
        const property = filterProperties.find(
          (p: z.infer<typeof FilterProperty>) => p.name === condition.propertyName
        )
        if (!property) return false
        // Validate operator is valid for this property
        return property.operators?.includes(condition.operator) ?? false
      })
    }

    if (!validatePropertyNames(object)) {
      throw new Error('Invalid property names or operators in generated filter')
    }

    // Zod will throw an error if the object doesn't match the schema
    const validatedFilters = FilterGroup.parse(object)
    return Response.json(validatedFilters)
  } catch (error: any) {
    console.error('Error in AI filtering:', error)
    return Response.json({ error: error.message || 'AI filtering failed' }, { status: 500 })
  }
}
```

----------------------------------------

TITLE: Supabase Database and Storage Schema
DESCRIPTION: SQL script defining the `profiles` table with user authentication references, row-level security policies for select, insert, and update operations, Realtime setup for `profiles`, and Storage bucket configuration for `avatars` with public access policies.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/flutter-user-management/README.md#_snippet_2

LANGUAGE: sql
CODE:
```
-- Create a table for public "profiles"
create table profiles (
  id uuid references auth.users not null,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,

  primary key (id),
  unique(username),
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;

-- Set up Storage!
insert into storage.buckets (id, name)
values ('avatars', 'avatars');

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );
```

----------------------------------------

TITLE: Configure Supabase Environment Variables
DESCRIPTION: Add the necessary Supabase URL and anonymous key to your project's .env file. These variables are crucial for your application to connect and interact with your Supabase backend, enabling authentication and data operations.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/ui-library/content/docs/tanstack/password-based-auth.mdx#_snippet_0

LANGUAGE: env
CODE:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

----------------------------------------

TITLE: Store Amazon Bedrock Embeddings in Postgres with vecs
DESCRIPTION: This Python code connects to a Postgres database using `vecs`, creates or retrieves a vector collection named 'sentences' with a dimension matching the Titan embeddings, and then upserts the previously generated embeddings into this collection. Finally, it creates an index for efficient similarity searches.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/integrations/amazon-bedrock.mdx#_snippet_2

LANGUAGE: python
CODE:
```
import vecs

DB_CONNECTION = "postgresql://<user>:<password>@<host>:<port>/<db_name>"

# create vector store client
vx = vecs.Client(DB_CONNECTION)

# create a collection named 'sentences' with 1536 dimensional vectors
# to match the default dimension of the Titan Embeddings G1 - Text model
sentences = vx.get_or_create_collection(name="sentences", dimension=1536)

# upsert the embeddings into the 'sentences' collection
sentences.upsert(records=embeddings)

# create an index for the 'sentences' collection
sentences.create_index()
```

----------------------------------------

TITLE: Define Foreign Key with CASCADE Delete
DESCRIPTION: Illustrates how to create a foreign key constraint on `child_table` referencing `parent_table` with the `ON DELETE CASCADE` option, ensuring that deleting a parent row also deletes all related rows in the child table.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/cascade-deletes.mdx#_snippet_0

LANGUAGE: sql
CODE:
```
alter table child_table
add constraint fk_parent foreign key (parent_id) references parent_table (id)
  on delete cascade;
```

----------------------------------------

TITLE: Create GIN and HNSW indexes for hybrid search performance
DESCRIPTION: Establishes indexes on the `documents` table to optimize search performance. A GIN index is created on the `fts` column for efficient full-text search, and an HNSW index is applied to the `embedding` column using `vector_ip_ops` for fast approximate nearest neighbor semantic search. These indexes are crucial for scaling queries.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/hybrid-search.mdx#_snippet_1

LANGUAGE: SQL
CODE:
```
-- Create an index for the full-text search
create index on documents using gin(fts);

-- Create an index for the semantic vector search
create index on documents using hnsw (embedding vector_ip_ops);
```

----------------------------------------

TITLE: Postgres Row Level Security Policies, Realtime, and Storage Setup
DESCRIPTION: This SQL snippet defines the 'profiles' table, enables Row Level Security (RLS), and sets up policies for public viewing, user-specific inserts, and updates. It also configures Supabase Realtime for the 'profiles' table and creates policies for 'avatars' storage bucket, allowing public access and uploads.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/sveltekit-user-management/README.md#_snippet_0

LANGUAGE: SQL
CODE:
```
-- Create a table for Public Profiles
create table profiles (
  id uuid references auth.users not null,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,
  primary key (id),
  unique(username),
  constraint username_length check (char_length(username) >= 3)
);
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );
create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );
-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;
-- Set up Storage!
insert into storage.buckets (id, name)
values ('avatars', 'avatars');
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );
```

----------------------------------------

TITLE: Generate TypeScript Types for Supabase Schemas
DESCRIPTION: This command generates TypeScript type definitions for the `storage` and `public` schemas from your Supabase project, saving them to a `types.ts` file within your Edge Function directory. Remember to replace `your-project-ref` with your actual Supabase project ID.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/huggingface-image-captioning/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
supabase gen types typescript --project-id=your-project-ref --schema=storage,public > supabase/functions/huggingface-image-captioning/types.ts
```

----------------------------------------

TITLE: Configure Supabase Environment Variables
DESCRIPTION: This snippet shows the required environment variables for connecting to a Supabase project. These values are essential for the Supabase client to initialize and interact with your backend services, allowing your application to communicate with Supabase.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/ui-library/content/docs/react/password-based-auth.mdx#_snippet_0

LANGUAGE: env
CODE:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

----------------------------------------

TITLE: Creating `authorize` Function for RLS in PostgreSQL
DESCRIPTION: This PostgreSQL function, `public.authorize`, is designed to implement Role-Based Access Control (RBAC) within Row Level Security (RLS) policies. It retrieves the `user_role` from the user's JWT, then checks if that role has the `requested_permission` by querying the `public.role_permissions` table, returning `true` if authorized.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/custom-claims-and-role-based-access-control-rbac.mdx#_snippet_4

LANGUAGE: sql
CODE:
```
create or replace function public.authorize(
  requested_permission app_permission
)
returns boolean as $$
declare
  bind_permissions int;
  user_role public.app_role;
begin
  -- Fetch user role once and store it to reduce number of calls
  select (auth.jwt() ->> 'user_role')::public.app_role into user_role;

  select count(*)
  into bind_permissions
  from public.role_permissions
  where role_permissions.permission = requested_permission
    and role_permissions.role = user_role;

  return bind_permissions > 0;
end;
$$ language plpgsql stable security definer set search_path = '';
```

----------------------------------------

TITLE: Deno Edge Function for Authenticated OpenAI Realtime API Relay
DESCRIPTION: This Deno Edge Function sets up an authenticated WebSocket relay to OpenAI's Realtime API. It handles WebSocket upgrade requests, authenticates users via Supabase Auth using a JWT passed in URL query parameters, and then proxies messages between the client and OpenAI's WebSocket, ensuring the OpenAI API key remains secure on the server-side. It also includes error handling for authentication failures and connection issues.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2024-12-03-edge-functions-background-tasks-websockets.mdx#_snippet_2

LANGUAGE: jsx
CODE:
```
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

Deno.serve(async (req) => {
  const upgrade = req.headers.get('upgrade') || ''

  if (upgrade.toLowerCase() != 'websocket') {
    return new Response("request isn't trying to upgrade to websocket.")
  }

  // WebSocket browser clients does not support sending custom headers.
  // We have to use the URL query params to provide user's JWT.
  // Please be aware query params may be logged in some logging systems.
  const url = new URL(req.url)
  const jwt = url.searchParams.get('jwt')
  if (!jwt) {
    console.error('Auth token not provided')
    return new Response('Auth token not provided', { status: 403 })
  }
  const { error, data } = await supabase.auth.getUser(jwt)
  if (error) {
    console.error(error)
    return new Response('Invalid token provided', { status: 403 })
  }
  if (!data.user) {
    console.error('user is not authenticated')
    return new Response('User is not authenticated', { status: 403 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)

  socket.onopen = () => {
    // initiate an outbound WebSocket connection to OpenAI
    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'

    // openai-insecure-api-key isn't a problem since this code runs in an Edge Function
    const openaiWS = new WebSocket(url, [
      'realtime',
      `openai-insecure-api-key.${OPENAI_API_KEY}`,
      'openai-beta.realtime-v1'
    ])

    openaiWS.onopen = () => {
      console.log('Connected to OpenAI server.')

      socket.onmessage = (e) => {
        console.log('socket message:', e.data)
        // only send the message if openAI ws is open
        if (openaiWS.readyState === 1) {
          openaiWS.send(e.data)
        } else {
          socket.send(
            JSON.stringify({
              type: 'error',
              msg: 'openAI connection not ready'
            })
          )
        }
      }
    }

    openaiWS.onmessage = (e) => {
      console.log(e.data)
      socket.send(e.data)
    }

    openaiWS.onerror = (e) => console.log('OpenAI error: ', e.message)
    openaiWS.onclose = (e) => console.log('OpenAI session closed')
  }

  socket.onerror = (e) => console.log('socket errored:', e.message)
  socket.onclose = () => console.log('socket closed')

  return response // 101 (Switching Protocols)
})
```

----------------------------------------

TITLE: Supabase Postgres RLS for Profiles and Storage
DESCRIPTION: This SQL snippet defines a `profiles` table with Row Level Security (RLS) policies for public viewing, user-specific inserts and updates. It also includes a PL/pgSQL trigger function (`handle_new_user`) to automatically create a profile entry when a new user signs up via Supabase Auth. Additionally, it sets up an `avatars` storage bucket with RLS policies for public access, and user-specific uploads and updates.
SOURCE: https://github.com/supabase/supabase/blob/master/examples/user-management/nextjs-user-management/README.md#_snippet_3

LANGUAGE: sql
CODE:
```
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Set up Storage!
insert into storage.buckets (id, name)
  values ('avatars', 'avatars');

-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage#policy-examples for more details.
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can update their own avatar." on storage.objects
  for update using ( auth.uid() = owner ) with check (bucket_id = 'avatars');
```

----------------------------------------

TITLE: Implement Supabase Email OTP Confirmation Endpoint Across Frameworks
DESCRIPTION: This collection of code snippets demonstrates how to create an API endpoint (`/auth/confirm`) to handle email OTP (One-Time Password) verification using Supabase across various JavaScript frameworks like Next.js, SvelteKit, Astro, and Remix. Each example extracts `token_hash` and `type` from the URL, uses `supabase.auth.verifyOtp` to confirm the user's email, and redirects based on the verification outcome. The implementations vary slightly based on the framework's server-side request and response handling, as well as Supabase client initialization.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/passwords.mdx#_snippet_9

LANGUAGE: TypeScript
CODE:
```
import { type EmailOtpType } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(redirectTo)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/auth/auth-code-error'
  return NextResponse.redirect(redirectTo)
}
```

LANGUAGE: TypeScript
CODE:
```
import { redirect } from '@sveltejs/kit'
import { type EmailOtpType } from '@supabase/supabase-js'

export const GET = async (event) => {
  const {
    url,
    locals: { supabase },
  } = event
  const token_hash = url.searchParams.get('token_hash') as string
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next') ?? '/'

  /**
   * Clean up the redirect URL by deleting the Auth flow parameters.
   *
   * `next` is preserved for now, because it's needed in the error case.
   */
  const redirectTo = new URL(url)
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      redirectTo.searchParams.delete('next')
      redirect(303, redirectTo)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/auth/error'
  redirect(303, redirectTo)
}
```

LANGUAGE: TypeScript
CODE:
```
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'
import { type APIRoute } from 'astro'

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') || '/'

  if (token_hash && type) {
    const supabase = createServerClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(request.headers.get('Cookie') ?? '')
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookies.set(name, value, options))
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      return redirect(next)
    }
  }

  // return the user to an error page with some instructions
  return redirect('/auth/auth-code-error')
}
```

LANGUAGE: TypeScript
CODE:
```
import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function loader({ request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') || '/'
  const headers = new Headers()

  if (token_hash && type) {
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '')
        }
```

----------------------------------------

TITLE: Supabase CLI: Manage Database Migration Scripts
DESCRIPTION: Provides documentation for the `supabase migration` command, designed to manage version-controlled SQL database migration files. It includes subcommands for listing local and remote migrations, creating new scripts, repairing migration history, squashing multiple migrations into one file, and applying pending migrations to the local database.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/www/_blog/2023-08-08-supabase-local-dev.mdx#_snippet_2

LANGUAGE: APIDOC
CODE:
```
supabase migration
Manage database migration scripts

Usage:
  supabase migration [command]

Available Commands:
  list        List local and remote migrations
  new         Create an empty migration script
  repair      Repair the migration history table
  squash      Squash migrations to a single file
  up          Apply pending migrations to local database
```

----------------------------------------

TITLE: Start Supabase Locally
DESCRIPTION: This command initializes and starts your local Supabase services. Upon execution, all migration files located in `supabase/migrations` will be applied to your local database, preparing it for development.
SOURCE: https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/ai/examples/nextjs-vector-search.mdx#_snippet_6

LANGUAGE: bash
CODE:
```
supabase start
```