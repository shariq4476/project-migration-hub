CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, email text, display_name text, created_at timestamptz, roles text[], listings bigint, deals bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required.'; END IF;
  RETURN QUERY
  SELECT p.id, u.email::text, p.display_name, p.created_at,
    COALESCE((SELECT array_agg(r.role::text) FROM public.user_roles r WHERE r.user_id = p.id), '{}'),
    (SELECT count(*) FROM public.listings l WHERE l.seller_id = p.id),
    (SELECT count(*) FROM public.deals d WHERE d.buyer_id = p.id OR d.seller_id = p.id)
  FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_role(_user uuid, _role app_role, _grant boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required.'; END IF;
  IF NOT _grant AND _user = auth.uid() AND _role = 'admin' THEN RAISE EXCEPTION 'You cannot remove your own administrator access.'; END IF;
  IF _grant THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (_user, _role) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user AND role = _role;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_delete_listing(_listing uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required.'; END IF;
  IF EXISTS (SELECT 1 FROM public.deals WHERE listing_id = _listing) THEN
    RAISE EXCEPTION 'This listing has deals. Suspend it instead of deleting.';
  END IF;
  DELETE FROM public.watchlist WHERE listing_id = _listing;
  DELETE FROM public.reports WHERE listing_id = _listing;
  DELETE FROM public.bids WHERE listing_id = _listing;
  DELETE FROM public.offers WHERE listing_id = _listing;
  DELETE FROM public.listing_reviews WHERE listing_id = _listing;
  DELETE FROM public.listings WHERE id = _listing;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_commission(_rate numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required.'; END IF;
  IF _rate < 0 OR _rate > 0.5 THEN RAISE EXCEPTION 'Commission must be between 0%% and 50%%.'; END IF;
  UPDATE public.site_settings SET commission_rate = _rate, updated_at = now() WHERE id = 1;
END $$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_role(uuid, app_role, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_listing(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_commission(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, app_role, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_listing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_commission(numeric) TO authenticated;

ALTER TABLE public.profiles ADD COLUMN suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.site_settings ADD COLUMN announcement text NOT NULL DEFAULT '';

CREATE TABLE public.admin_audit(id uuid primary key default gen_random_uuid(), admin_id uuid not null, action text not null, target text, detail text, created_at timestamptz not null default now());
GRANT SELECT ON public.admin_audit TO authenticated; GRANT ALL ON public.admin_audit TO service_role;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_admin_read ON public.admin_audit FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX admin_audit_time ON public.admin_audit(created_at desc);

CREATE OR REPLACE FUNCTION public.admin_log(_action text, _target text, _detail text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required.'; END IF;
  INSERT INTO public.admin_audit(admin_id, action, target, detail) VALUES (auth.uid(), left(_action,80), left(_target,200), left(_detail,1000));
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_suspended(_user uuid, _suspended boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required.'; END IF;
  IF _user = auth.uid() THEN RAISE EXCEPTION 'You cannot suspend your own account.'; END IF;
  UPDATE public.profiles SET suspended = _suspended, updated_at = now() WHERE id = _user;
  IF _suspended THEN
    UPDATE public.listings SET status = 'suspended', updated_at = now() WHERE seller_id = _user AND status IN ('approved','pending');
  END IF;
  INSERT INTO public.admin_audit(admin_id, action, target) VALUES (auth.uid(), CASE WHEN _suspended THEN 'suspend user' ELSE 'reinstate user' END, _user::text);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_announcement(_text text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Administrator access is required.'; END IF;
  UPDATE public.site_settings SET announcement = left(coalesce(_text,''),300), updated_at = now() WHERE id = 1;
  INSERT INTO public.admin_audit(admin_id, action, detail) VALUES (auth.uid(), 'update announcement', left(_text,300));
END $$;

REVOKE ALL ON FUNCTION public.admin_log(text,text,text), public.admin_set_suspended(uuid,boolean), public.admin_set_announcement(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_log(text,text,text), public.admin_set_suspended(uuid,boolean), public.admin_set_announcement(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.block_suspended() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND suspended) THEN RAISE EXCEPTION 'Your account is suspended. Contact support.'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER listings_block_suspended BEFORE INSERT ON public.listings FOR EACH ROW EXECUTE FUNCTION public.block_suspended();
CREATE TRIGGER offers_block_suspended BEFORE INSERT ON public.offers FOR EACH ROW EXECUTE FUNCTION public.block_suspended();
CREATE TRIGGER bids_block_suspended BEFORE INSERT ON public.bids FOR EACH ROW EXECUTE FUNCTION public.block_suspended();
CREATE TRIGGER deals_block_suspended BEFORE INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION public.block_suspended();

ALTER TABLE public.profiles ADD COLUMN account_type text NOT NULL DEFAULT 'buyer' CHECK (account_type IN ('buyer','seller'));
UPDATE public.profiles p SET account_type = 'seller' WHERE EXISTS (SELECT 1 FROM public.listings l WHERE l.seller_id = p.id);
GRANT UPDATE(account_type) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(id, display_name, account_type) VALUES (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'full_name',''), 'Member'),
    CASE WHEN new.raw_user_meta_data->>'account_type' = 'seller' THEN 'seller' ELSE 'buyer' END
  );
  INSERT INTO public.user_roles(user_id, role) VALUES (new.id, 'user');
  RETURN new;
END $$;

CREATE OR REPLACE FUNCTION public.require_seller_account() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND account_type = 'seller') THEN
    RAISE EXCEPTION 'Switch to a seller account to list assets.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER listings_require_seller BEFORE INSERT ON public.listings FOR EACH ROW EXECUTE FUNCTION public.require_seller_account();

alter table public.listings drop constraint if exists listings_category_check;
update public.listings set category = case category
  when 'content' then 'adsense' when 'website' then 'directory' when 'saas' then 'directory'
  when 'app' then 'service' when 'domain' then 'service' else category end
where category in ('content','website','saas','app','domain');
update public.listings set title='TrailGear.pk — Outdoor gear WooCommerce store', summary='WooCommerce store shipping nationwide with COD and repeat buyers.', category='ecommerce' where slug='trailgear-shop';
update public.listings set title='TaleemHub — Pakistani education portal', summary='Past papers and admissions portal with 400+ paid institute listings.', category='directory', sale_type='auction' where slug='invoicely-saas';
update public.listings set title='TechKhabar — Urdu tech news blog', summary='AdSense-approved Urdu tech blog with 700+ articles and organic traffic.', category='adsense' where slug='cryptobrief-blog';
update public.listings set title='MobilePriceZone — Phone review affiliate site', summary='Mobile price and review site earning from Daraz and Amazon affiliates.', category='affiliate' where slug='pixeltools-domain';
update public.listings set title='LahoreMovers — Lead generation website', summary='Ranked service site generating moving leads in Lahore and Islamabad.', category='service' where slug='fitplan-app';
update public.listings set title='DesiKitchen — Spices online store', summary='Shopify store selling spices across Pakistan and to UAE expats.', category='ecommerce' where slug='petnest-store';
update public.listings set title='RozgarPK — Job listings board', summary='Niche job board with paid postings and a 25k WhatsApp/email audience.', category='directory' where slug='devjobs-board';
update public.listings set title='DesiRecipes — Recipe content site', summary='AdSense monetized recipe site with Pinterest and Google traffic.', category='adsense' where slug='recipehub-site';
alter table public.listings add constraint listings_category_check check (category in ('adsense','affiliate','ecommerce','directory','service'));

alter table public.payment_settings
  add column if not exists jazzcash_account text not null default '',
  add column if not exists easypaisa_account text not null default '',
  add column if not exists bank_transfer_details text not null default '',
  add column if not exists raast_id text not null default '';
alter table public.payout_details drop constraint if exists payout_details_method_check;
alter table public.payout_details add constraint payout_details_method_check check (method in ('binance_pay','usdt_trc20','usdt_bep20','jazzcash','easypaisa','bank_transfer','raast'));
do $do$
declare def text;
begin
  select pg_get_functiondef('public.deal_action(uuid,text,text,text)'::regprocedure) into def;
  def := replace(def, $s$_text2 not in ('binance_pay','usdt_trc20','usdt_bep20')$s$, $s$_text2 not in ('binance_pay','usdt_trc20','usdt_bep20','jazzcash','easypaisa','bank_transfer','raast')$s$);
  def := replace(def, $s$case _text2 when 'binance_pay' then binance_pay_id when 'usdt_trc20' then usdt_trc20_address else usdt_bep20_address end$s$, $s$case _text2 when 'binance_pay' then binance_pay_id when 'usdt_trc20' then usdt_trc20_address when 'usdt_bep20' then usdt_bep20_address when 'jazzcash' then jazzcash_account when 'easypaisa' then easypaisa_account when 'bank_transfer' then bank_transfer_details else raast_id end$s$);
  if position('jazzcash_account' in def) = 0 then raise exception 'deal_action not patched'; end if;
  execute def;
end
$do$;