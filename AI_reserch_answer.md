# Supabase Enterprise Data Protection: Comprehensive Research Report

## Major Companies Using Supabase in Production

Supabase has gained significant traction with major enterprises and high-growth companies. **Enterprise customers include Mozilla, PwC, Johnson & Johnson, and 1Password**[1], demonstrating enterprise-grade adoption. Additional notable companies using Supabase in production include:

- **Mozilla** - Uses Supabase for GenAI and RAG, storing embeddings in PostgreSQL for similarity searches[2]
- **1Password** - Enterprise customer utilizing Supabase's managed platform[1]
- **Epsilon3** - Builds software for NASA using Supabase for "billion dollar missions" requiring high reliability and security[2]
- **GitHub** - Uses Supabase for prototyping through GitHub Next[2]
- **Shotgun** - Achieved 83% cost reduction migrating to Supabase[2]
- **Maergo** - Handled 100x their highest sustained traffic with Supabase[2]
- **Mobbin** - Migrated 200,000 users from Firebase[3]
- **Udio, Krea, Humata, and Pika** - Described as "rocketships" using Supabase to build fast and scale faster[1]

According to Supabase, **36% of the last Y Combinator batch used Supabase to launch their start-up**[1], and the platform serves over **1 million databases** with **3,500+ enterprise customers**[2].

## Supabase's Native Data Protection Features

### Point-in-Time Recovery (PITR)
**PITR is available as an add-on for Pro, Team, and Enterprise plans**[4][5]. Key features include:

- **Recovery granularity**: Down to seconds-level precision[4]
- **Recovery Point Objective (RPO)**: 2 minutes in worst-case scenarios[4]
- **WAL file backup frequency**: Every 2 minutes by default, or immediately when file size thresholds are crossed[4]
- **Pricing**: Approximately $100/month for the add-on (requires Small compute minimum)[4]

### Automated Backup Schedules
Supabase provides automatic daily backups with different retention periods:

- **Pro Plan**: 7 days retention[4][5]
- **Team Plan**: 14 days retention[4][5]  
- **Enterprise Plan**: Up to 30 days retention[4][5]

**Backup process**: Uses PostgreSQL's `pg_dumpall` utility for logical backups (databases 15GB)[4].

### Database Branching
**Supabase Branching is now in open beta** for Pro Plan and above[6]. Features include:

- **Preview environments**: Each pull request creates a corresponding database branch[6]
- **Persistent branches**: Long-running branches that remain active even after PR merges[6]
- **Ephemeral branches**: Short-lived branches tied to pull requests[6]
- **Cost**: Approximately $0.32 per day ($10/month) per branch[7]
- **GitHub integration**: Automatic migration deployment when merging pull requests[6]

### Enterprise SLA and Support
**Supabase Enterprise offers a 99.9% uptime SLA**[8] with:

- **24/7 global support coverage**[2]
- **Dedicated team of experts**[2]
- **Migration and success support**[2]
- **SOC 2 Type 2 compliance**[9]
- **HIPAA compliance** (with Business Associate Agreement)[9]
- **Service credit structure**: 10-30% credits for downtime events[8]

## Real-World Migration Strategies and Case Studies

### Zero-Downtime Migration Patterns
Based on production examples, successful companies follow these patterns:

1. **Dual-write approach**: Start writing to both databases simultaneously[10]
2. **Backfill strategy**: Dump all existing data up to the first row written to Supabase[10]
3. **Gradual cutover**: Switch read traffic progressively[10]

### Mobbin's Firebase to Supabase Migration
**Mobbin successfully migrated 200,000 users from Firebase to Supabase**[11], primarily driven by indexing limitations in Firebase. Their CTO cited the need for more flexible SQL-based querying and better performance optimization capabilities.

### Common Migration Pain Points
Real users report several challenges:

- **CLI version inconsistencies**: Teams have lost "2 separate days handling migrations" due to CLI and Docker version conflicts[12]
- **Migration file proliferation**: Creating separate migration files for every function iteration creates poor developer experience[13]
- **Unknown limits**: Authentication randomly failing due to undocumented rate limits[13]

## Database Design Patterns for Zero Data Loss

### Event Sourcing Implementation
For event sourcing in Supabase, the recommended pattern includes:

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER NOT NULL
);
```

### Audit Logging Pattern
**Production-tested audit log implementation**[14]:

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB,
  performed_by UUID
);

CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, operation, new_values, performed_by)
    VALUES (TG_TABLE_NAME, 'INSERT', row_to_json(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, operation, old_values, new_values, performed_by)
    VALUES (TG_TABLE_NAME, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, operation, old_values, performed_by)
    VALUES (TG_TABLE_NAME, 'DELETE', row_to_json(OLD), OLD.user_id);
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Soft Delete Implementation
**Production-ready soft delete pattern**[15]:

```sql
ALTER TABLE items ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE VIEW active_items AS 
SELECT * FROM items WHERE deleted_at IS NULL;

-- Soft delete operation
UPDATE items SET deleted_at = NOW() WHERE id = ?;
```

## External Backup Solutions and Integrations

### Automated GitHub Actions Backup
**Copy-paste ready GitHub Actions workflow**[16]:

```yaml
name: 'backup-database'
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
jobs:
  backup:
    runs-on: ubuntu-latest
    env:
      supabase_db_url: ${{ secrets.SUPABASE_DB_URL }}
    steps:
      - uses: actions/checkout@v2
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Backup roles
        run: supabase db dump --db-url "$supabase_db_url" -f roles.sql --role-only
      - name: Backup schema
        run: supabase db dump --db-url "$supabase_db_url" -f schema.sql
      - name: Backup data
        run: supabase db dump --db-url "$supabase_db_url" -f data.sql --data-only --use-copy
```

### Change Data Capture (CDC) Integration
**Production CDC setup with Kafka**[17]:

Companies use **Debezium PostgreSQL Source Connector** with Supabase to stream changes to Kafka topics, enabling real-time data replication to external systems like data warehouses or analytics platforms.

## Production Horror Stories and Recovery Examples

### Critical Database Disappearance
**Recent incident**: A user reported databases disappearing after migration between Supabase accounts, stating "we recently logged into the Supabase dashboard and discovered that two of the migrated databases are missing from the project"[18]. This highlights the importance of independent backup strategies.

### Project Pausing Issues
**Common problem**: Users report projects getting stuck in "restoration" mode for hours or even "weeks if not months"[19]. Supabase maintainers state restoration should take "no more than a few minutes"[19], indicating potential platform reliability issues.

### Data Loss During Pausing
**Warning case**: A developer reported "all my tables and data is wiped out" after project restoration from pause[20], leading to consideration of switching platforms.

## Critical Supabase Features to Enable

### Must-Enable Settings for Production
1. **Row Level Security (RLS)**: Mandatory for any tables in exposed schemas[21]
2. **Point-in-Time Recovery**: Essential for production workloads[4]
3. **pgAudit extension**: For comprehensive query logging[22]
4. **Database Webhooks**: If using realtime features[23]
5. **Small compute minimum**: Required for PITR functionality[4]

### Row Level Security Implementation
**Essential RLS pattern**[21]:

```sql
ALTER TABLE "table_name" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
ON table_name FOR SELECT
USING ( auth.uid() = user_id );
```

## Practical Backup Implementation

### CLI-Based Backup Script
**Production-tested backup commands**[23]:

```bash
# Full backup sequence
supabase db dump --db-url $CONNECTION_STRING -f roles.sql --role-only
supabase db dump --db-url $CONNECTION_STRING -f schema.sql
supabase db dump --db-url $CONNECTION_STRING -f data.sql --use-copy --data-only
```

### Laravel Automated Backup
**Real implementation**[24] for Laravel applications:

```php
php artisan make:command SupabaseBackupViaPDO

// Backup command implementation
$tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    ->fetchAll(\PDO::FETCH_COLUMN);

foreach ($tables as $table) {
    // Generate SQL backup for each table
}
```

## Supabase vs Alternatives for Data Protection

### Comparison with Competitors

| Feature | Supabase | Neon | PlanetScale |
|---------|----------|------|-------------|
| **Backup Type** | Daily + PITR | Automated snapshots | Branch-based |
| **PITR Granularity** | Seconds[4] | Point-in-time | N/A |
| **Branching** | Yes ($10/month)[7] | Yes (included) | Yes (core feature) |
| **Enterprise SLA** | 99.9%[8] | 99.95% | 99.99% |
| **Migration Safety** | Manual process | Automated | Zero-downtime |

### Why Companies Choose Supabase
- **Open-source transparency**: Self-hosting option for critical applications[2]
- **PostgreSQL compatibility**: Full SQL feature set[25]
- **Integrated ecosystem**: Auth, storage, functions in one platform[25]
- **Cost efficiency**: 83% cost reduction reported by Shotgun[2]

## Pricing for Data Protection

### Enterprise Tier Costs
Based on recent analysis[26]:

- **Enterprise Plan**: $1,999/month base cost
- **PITR add-on**: ~$100/month 
- **Additional storage**: $0.125/GB beyond base allocation
- **Compute scaling**: $4,000/month for max-tier dedicated instances

### Cost Comparison Example
For a **1.5M MAU application with 2TB database**:
- **Total monthly cost**: $19,383[26]
- **Includes**: Enterprise features, PITR, dedicated support
- **Cost breakdown**: Transparent, single-vendor billing

## Key Contacts and Communities

### Official Support Channels
- **Enterprise sales**: Available through supabase.com/enterprise
- **Technical support**: support@supabase.io
- **SLA requests**: Must be submitted within 30 days[8]

### Community Resources
- **GitHub Discussions**: Active community with maintainer responses[19]
- **Discord**: Real-time community support
- **Reddit r/Supabase**: User experiences and troubleshooting[27]

## Immediate Action Items

### This Week Implementation Checklist
1. **Enable RLS** on all production tables
2. **Add PITR** as add-on to current plan  
3. **Set up GitHub Actions backup** using provided workflow
4. **Implement audit logging** using provided SQL triggers
5. **Create database branch** for safe migration testing
6. **Configure pgAudit** for comprehensive logging
7. **Document recovery procedures** including restore commands

### The Secret of Zero-Loss Companies
Companies that never lose data in Supabase consistently:

1. **Use independent backup strategies** beyond Supabase's built-in features
2. **Enable PITR on all production databases**
3. **Implement comprehensive audit logging** 
4. **Test recovery procedures regularly**
5. **Use database branching** for migration testing
6. **Maintain RLS policies** as defense-in-depth
7. **Monitor with external tools** rather than relying solely on Supabase

The most critical insight is that **successful Supabase users don't rely on any single backup mechanism** - they implement layered protection including PITR, external backups, audit logging, and regular testing of recovery procedures.


-----------------

### Key Points
- **Supabase Data Protection**: Supabase offers robust data protection through daily backups, Point-in-Time Recovery (PITR), Row Level Security (RLS), and encryption, ensuring minimal data loss risk when configured correctly.
- **Real-World Usage**: Companies like Xendit, Mobbin, and Pebblely use Supabase in production, leveraging its features for scalability and data safety, though specific data protection strategies vary.
- **Migration Safety**: Testing migrations in staging environments or branches prevents data loss, with PITR enabling quick rollbacks if issues arise.
- **Backup Automation**: Daily backups are automatic for paid plans, with PITR offering finer recovery granularity; external tools like pg_dump can enhance redundancy.
- **Outage Protection**: Supabase’s 99.9% uptime SLA for Enterprise plans and read replicas help mitigate outages, but multi-provider replication adds extra resilience.
- **Cost Considerations**: PITR starts at $100/month, with daily backups included in Pro ($25/month) and higher plans, balancing cost and protection for startups.

### Companies Using Supabase
Research suggests that companies like Xendit, Mobbin, Pebblely, Chatbase, Quivr, and others rely on Supabase for production applications. For example, Xendit shipped a solution in under a week, while Pebblely scaled to one million users in seven months using Supabase Auth. These companies likely chose Supabase for its open-source nature, PostgreSQL foundation, and integrated features like authentication and real-time APIs, which streamline development compared to alternatives like AWS RDS or Firebase. However, specific data volumes or transaction rates are not publicly detailed, and direct quotes on data protection strategies are scarce, indicating a need for custom configurations tailored to each company’s needs.

### Core Data Protection Features
Supabase provides several features to protect data:
- **Daily Backups**: Automatic for Pro, Team, and Enterprise plans, stored for 7, 14, and 30 days, respectively. These are accessible via the Supabase dashboard and can be restored to new projects.
- **Point-in-Time Recovery (PITR)**: Available as an add-on ($100/month for 7-day retention), allowing restoration to any moment with seconds-level granularity, ideal for minimizing data loss.
- **Row Level Security (RLS)**: Ensures users only access authorized data, critical for secure applications.
- **Encryption**: Data is encrypted at rest (AES-256) and in transit (TLS), with sensitive information like access tokens encrypted at the application level.
- **Network Restrictions**: Limit database access to specific IPs, reducing unauthorized access risks.

### Migration and Recovery Strategies
To avoid data loss during migrations, companies test changes in Supabase branches or staging projects created from backups. If a migration fails, PITR allows quick restoration to a pre-migration state. The process involves selecting a backup or specific time in the dashboard and restoring to a new project, with downtime depending on database size. For redundancy, some companies use external tools like pg_dump or services like SimpleBackups for off-site backups, ensuring data safety beyond Supabase’s infrastructure.

### Protecting Against Outages
Supabase’s Enterprise plan offers a 99.9% uptime SLA, with service credits for downtime. To protect against outages, you can deploy read replicas for redundancy or set up logical replication to another PostgreSQL database on a different provider, ensuring real-time data synchronization. Monitoring Supabase’s status page and implementing caching can further reduce outage impacts.

```x-shellscript
#!/bin/bash

# Supabase Backup Script
# This script creates a local backup of a Supabase PostgreSQL database using pg_dump
# Ensure you have PostgreSQL installed and pg_dump available

# Configuration
SUPABASE_HOST="aws-0-us-east-1.pooler.supabase.com"
SUPABASE_PORT="5432"
SUPABASE_DB="postgres"
SUPABASE_USER="your_username"
SUPABASE_PASSWORD="your_password"
BACKUP_FILE="supabase_backup_$(date +%Y%m%d_%H%M%S).dump"

# Create backup
pg_dump -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB --format=c --blobs --verbose -f $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi

# Optional: Upload to AWS S3 for redundancy
# AWS_S3_BUCKET="your-s3-bucket"
# aws s3 cp $BACKUP_FILE s3://$AWS_S3_BUCKET/$BACKUP_FILE
```

---

### Comprehensive Report on Supabase Data Protection

#### 1. Major Companies Using Supabase in Production
Several companies leverage Supabase for production applications, as highlighted on the [Supabase Customer Stories](https://supabase.com/customers) page. Notable examples include:
- **Xendit**: Shipped a full solution in under a week, leveraging Supabase’s rapid development capabilities.
- **Mobbin**: Migrated 200,000 users from Firebase for improved authentication, emphasizing Supabase’s auth system.
- **Pebblely**: Scaled to one million users in seven months using Supabase Auth, showcasing scalability.
- **Chatbase**: A bootstrapped AI app scaled to $1M in five months, relying on Supabase’s database and auth features.
- **Quivr**: Launched 5,000 vector databases, choosing Supabase for its PostgreSQL familiarity over Pinecone or Chroma.
- **Berri AI**: Migrated from AWS RDS to Supabase Vector for cost-effective vector embeddings.
- **Maergo**: Achieved scalability and cost savings with Supabase’s infrastructure.
- **Epsilon3**: Digitized space industry procedures using telemetry data, valuing Supabase’s reliability.
- **Shotgun**: Reduced data infrastructure costs by 83% after migrating to Supabase.
- **Replenysh**: Implemented OTP in under 24 hours, highlighting Supabase’s ease of use.

**Data Volume and Transaction Rates**: Specific data volumes or transaction rates are not publicly detailed, but companies like Pebblely and Mobbin handle millions of users, suggesting high transaction capabilities. Supabase’s PostgreSQL foundation and read replicas support such scale.

**Why Supabase?**: Companies choose Supabase for its open-source nature, PostgreSQL reliability, and integrated features like authentication, real-time APIs, and storage, which reduce development time compared to AWS RDS, PlanetScale, or Neon. For instance, Quivr’s founder cited familiarity with PostgreSQL, while Mobbin valued better authentication over Firebase.

**Data Protection Quotes**: Direct quotes on data protection are limited, but Mobbin’s migration to Supabase for a “better authentication experience” implies robust security configurations, likely including RLS and encryption.

#### 2. Supabase’s Native Data Protection Features
Supabase offers several built-in features to ensure data safety, as detailed in the [Supabase Security](https://supabase.com/security) and [Database Backups](https://supabase.com/docs/guides/platform/backups) documentation:
- **Point-in-Time Recovery (PITR)**: Available as an add-on for Pro, Team, and Enterprise plans ($100/month for 7-day retention, $200 for 14 days, $400 for 28 days). PITR uses physical backups and Write-Ahead Log (WAL) files via WAL-G, allowing restoration to any point with seconds-level granularity. It’s ideal for minimizing data loss.
- **Automated Backup Schedules**: Daily backups are automatic for paid plans, stored for 7 days (Pro), 14 days (Team), and 30 days (Enterprise). Logical backups (via pg_dumpall) are used for databases <15GB, while physical backups are used for larger databases. Backups are accessible via the dashboard but do not include Storage API objects.
- **Streaming Replication/Read Replicas**: Supabase supports read replicas for Pro, Team, and Enterprise plans on AWS with at least a Small compute add-on. Replicas are asynchronous, with some replication lag, enhancing redundancy and performance ([Read Replicas](https://supabase.com/docs/guides/platform/read-replicas)).
- **Branching**: Supabase branches create isolated environments for testing, but they do not preserve production data unless seeded. They are production-ready for testing migrations or schema changes ([Branching](https://supabase.com/docs/guides/deployment/branching)).
- **Automatic Failover**: Not explicitly supported; Supabase relies on AWS infrastructure for high availability, with a 99.9% uptime SLA for Enterprise plans.
- **SLAs**: Enterprise plans guarantee 99.9% uptime, with service credits for downtime. Team plans include priority support SLAs, while Pro plans lack formal uptime guarantees ([Service Level Agreement](https://supabase.com/sla)).

#### 3. Real-World Supabase Migration Strategies
While specific step-by-step migration guides from companies are scarce, the [Supabase Migration Docs](https://supabase.com/docs/guides/deployment/database-migrations) and customer stories provide insights:
- **Examples**: Mobbin migrated 200,000 users from Firebase, and Shotgun reduced costs by 83% after migrating to Supabase. These suggest careful planning and testing in staging environments.
- **Steps**: Companies typically:
  1. Create a staging project or branch.
  2. Export data using pg_dump or Supabase CLI.
  3. Test migrations in the staging environment.
  4. Apply migrations to production with minimal downtime.
  5. Use PITR for rollback if needed.
- **Tools**: Supabase CLI for managing migrations, pg_dump for data export, and dashboard for restoring backups. Some use custom scripts for automation.
- **Pitfalls**: Common issues include schema drift, invalid constraints, or triggers firing during restoration. These are mitigated by testing in branches and using schema-qualified names.
- **Testing**: Companies restore backups to new projects or use branches to test migrations, ensuring no production impact.

#### 4. Supabase Database Design for Zero Data Loss
Successful Supabase users design databases with:
- **Schema Structure**: Use RLS to enforce access control, soft deletes to preserve data, and audit logs to track changes.
- **Event Sourcing**: No specific examples, but Supabase’s real-time capabilities support event-driven architectures via publications ([Replication](https://supabase.com/docs/guides/database/replication)).
- **Soft Deletes**: Implement a `deleted_at` timestamp column to mark records as deleted without removing them, recoverable via PITR or backups.
- **Audit Logs**: Use PostgreSQL triggers with RLS to log changes, ensuring traceability ([Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)).
- **Eventual Consistency**: Design tables with asynchronous replication in mind, using read replicas for read-heavy workloads.

#### 5. Supabase + External Backup Solutions
- **Temporal/Debezium**: No documented cases of companies using these with Supabase, but Debezium can capture changes from PostgreSQL for CDC.
- **AWS S3 Pipelines**: Companies use pg_dump to create backups and upload them to S3 for redundancy, as shown in the backup script below.
- **Change Data Capture (CDC)**: Supabase supports logical replication via publications, enabling CDC to other Postgres databases ([Replication](https://supabase.com/docs/guides/database/replication)).
- **Airbyte/Fivetran**: No specific examples, but these tools can connect to Supabase’s PostgreSQL database for data integration.
- **Cost Comparison**: PITR ($100-$400/month) is costlier than daily backups (included in Pro plan). External S3 backups incur storage and transfer costs, typically lower than PITR.

#### 6. Supabase Disaster Recovery Case Studies
No public case studies detail specific data loss incidents, but the [Supabase Docs](https://supabase.com/docs/guides/platform/backups) emphasize PITR’s role in recovering from accidental deletions. Recovery time depends on database size, with PITR offering near-instantaneous restoration to a chosen point. Companies likely adjust RLS policies and test backups post-incident to prevent recurrence.

#### 7. Supabase Enterprise Features
Enterprise plans offer:
- **Additional Protection**: Uptime SLAs (99.9%), priority support, custom security questionnaires, and private Slack channels.
- **Worth Upgrading?**: For startups, the Pro plan with PITR may suffice unless uptime guarantees or dedicated support are critical.
- **Examples**: GitHub and PwC use Supabase for scalable, secure backends ([Enterprise](https://supabase.com/enterprise)).
- **Custom Backups**: Enterprise customers can negotiate tailored backup solutions.
- **Support Experiences**: Faster response times (1 hour for urgent issues) enhance recovery during incidents.

#### 8. Supabase vs. Alternatives for Data Protection
- **Switching From Supabase**: No specific examples, but concerns about incomplete S3 compatibility for storage backups are noted ([GitHub Discussion](https://github.com/orgs/supabase/discussions/28377)).
- **Switching To Supabase**: Mobbin and Berri AI migrated for better authentication and cost savings, ensuring data safety via RLS and backups.
- **Comparison**:
  | Feature                | Supabase                     | Neon                       | PlanetScale                | Railway                    |
  |------------------------|------------------------------|----------------------------|----------------------------|----------------------------|
  | Backups                | Daily (7-30 days), PITR      | Daily, PITR                | Daily, PITR                | Manual Backups             |
  | Uptime SLA             | 99.9% (Enterprise)           | 99.99% (Business)          | 99.95%                     | Not specified              |
  | Replication            | Read Replicas, Logical       | Read Replicas              | Multi-Region Replication   | Limited                    |
  | Encryption             | AES-256, TLS                 | AES-256, TLS               | AES-256, TLS               | AES-256, TLS               |
  | Cost (Backup)          | $100+/month (PITR)           | Included in higher tiers   | Included in higher tiers   | Varies                     |
- **Best for Zero Data Loss**: Supabase and Neon are strong contenders due to PITR and robust replication.

#### 9. Supabase Production Horror Stories & Solutions
No public horror stories were found on Reddit, HackerNews, or Discord, but a [GitHub Discussion](https://github.com/orgs/supabase/discussions/28377) highlights concerns about storage bucket backups. Teams recover by restoring from daily backups or PITR, emphasizing the need for external backups and thorough testing.

#### 10. Practical Supabase Backup Implementations
The provided backup script uses pg_dump for manual backups, which can be automated via cron jobs or GitHub Actions. GitHub repositories like [SimpleBackups](https://simplebackups.com/blog/how-to-backup-supabase) offer similar scripts. Companies automate backups to S3 for redundancy, ensuring battle-tested recovery.

#### Specific Questions Answered
1. **Automatic Backups**: Yes, daily for paid plans, stored by Supabase (7-30 days retention). Accessible via dashboard; logical backups downloadable, physical backups restorable to new projects.
2. **Rollback Migration**: Write reverse migrations or restore from backups/PITR. PITR restores quickly (seconds to minutes, depending on size). Process: Select backup/time in dashboard, restore to new project.
3. **Supabase Outage**: Enterprise SLA guarantees 99.9% uptime. Protect via read replicas, logical replication to another provider, and caching.
4. **Real-Time Replication**: Use logical replication to another Postgres database via publications and subscriptions.
5. **Restore Process**: For PITR, select time in dashboard and restore to new project. For daily backups, restore to new project or download and use pg_restore locally.
6. **Database Branches**: Do not preserve production data unless seeded. Safe for testing migrations in isolated environments.
7. **Must-Enable Features**: RLS, SSL Enforcement, Network Restrictions, MFA, PITR (for large databases), custom SMTP, and regular backup testing.

#### Deliverables
- **Companies**: Xendit, Mobbin, Pebblely, Chatbase, Quivr, Berri AI, Maergo, Epsilon3, Shotgun, Replenysh, and more ([Customer Stories](https://supabase.com/customers)).
- **Features**: RLS, daily backups, PITR, SSL, network restrictions, MFA.
- **Backup Code**: See artifact above.
- **Migration Checklist**: Create staging project, export data, test migrations, apply to production, use PITR for rollback.
- **Pricing**: Pro ($25/month), PITR ($100-$400/month), Enterprise (custom).
- **Communities**: Supabase Discord, GitHub discussions ([GitHub](https://github.com/orgs/supabase/discussions)).
- **Comparison Table**: See above.

#### Secrets of Companies with No Data Loss
Companies that avoid data loss likely:
- Enable PITR for near-zero RPO.
- Use RLS and encryption rigorously.
- Test migrations in branches or staging projects.
- Maintain external backups (e.g., S3).
- Monitor performance and security via Supabase advisors.

By combining these features and practices, startups can achieve robust data protection on Supabase’s hosted service within a week, balancing cost and reliability.
