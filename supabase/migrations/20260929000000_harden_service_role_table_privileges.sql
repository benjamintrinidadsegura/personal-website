-- Remove residual direct table capabilities left by the initial Echo/admin
-- migrations while preserving the intentional service_role SELECT on echoes.
revoke truncate, references, trigger, maintain
on table
  public.admin_users,
  public.echo_contacts,
  public.echo_moderation_events,
  public.echo_rate_limits,
  public.echoes
from service_role;
