-- Create a function to allow admins to delete users from auth.users
-- This is necessary because deleting from public.profiles does not delete the auth user
create or replace function public.delete_user_account(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if the executing user is an admin
  if not public.is_admin(auth.uid()) then
    raise exception 'Access denied. Only admins can delete users.';
  end if;

  -- Delete the user from auth.users
  -- This will cascade to public.profiles and other tables due to FK relationships
  delete from auth.users where id = user_id;
end;
$$;

-- Grant execute permission to authenticated users (access controlled inside function)
grant execute on function public.delete_user_account(uuid) to authenticated;
