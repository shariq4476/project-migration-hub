ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS id_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_profile_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.id_verified IS DISTINCT FROM OLD.id_verified
      OR NEW.phone_verified IS DISTINCT FROM OLD.phone_verified
      OR NEW.payment_verified IS DISTINCT FROM OLD.payment_verified)
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can change verification status';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_profile_verification ON public.profiles;
CREATE TRIGGER guard_profile_verification BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verification();

CREATE OR REPLACE FUNCTION public.admin_set_verification(_user uuid, _kind text, _value boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required'; END IF;
  IF _kind = 'id' THEN UPDATE public.profiles SET id_verified = _value WHERE id = _user;
  ELSIF _kind = 'phone' THEN UPDATE public.profiles SET phone_verified = _value WHERE id = _user;
  ELSIF _kind = 'payment' THEN UPDATE public.profiles SET payment_verified = _value WHERE id = _user;
  ELSE RAISE EXCEPTION 'Unknown verification type'; END IF;
  PERFORM public.admin_log('set verification', _user::text, _kind || '=' || _value::text);
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_set_verification(uuid, text, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_set_verification(uuid, text, boolean) TO authenticated;