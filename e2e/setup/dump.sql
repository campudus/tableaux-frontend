--
-- PostgreSQL database dump
--

\restrict dbP73afzreKeTgKgxXjxah3dloCPogyr5qXcZ68lnaFdqapz0JYUsfhgTW6fGce

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: test
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO test;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: test
--

COMMENT ON SCHEMA public IS '';


--
-- Name: trigger__set_updated_at__if_modified(); Type: FUNCTION; Schema: public; Owner: test
--

CREATE FUNCTION public.trigger__set_updated_at__if_modified() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF ROW (NEW.*) IS DISTINCT FROM ROW (OLD.*) THEN
    NEW.updated_at = now();
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION public.trigger__set_updated_at__if_modified() OWNER TO test;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: file; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.file (
    uuid uuid NOT NULL,
    idfolder bigint,
    tmp boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.file OWNER TO test;

--
-- Name: file_lang; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.file_lang (
    uuid uuid NOT NULL,
    langtag character varying(50) NOT NULL,
    title character varying(255),
    description character varying(255),
    internal_name character varying(255),
    external_name character varying(255),
    mime_type character varying(255)
);


ALTER TABLE public.file_lang OWNER TO test;

--
-- Name: folder; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.folder (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255) NOT NULL,
    idparent bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.folder OWNER TO test;

--
-- Name: folder_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.folder_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.folder_id_seq OWNER TO test;

--
-- Name: folder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.folder_id_seq OWNED BY public.folder.id;


--
-- Name: system_annotations; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_annotations (
    name character varying(50) NOT NULL,
    priority integer NOT NULL,
    fg_color character varying(50),
    bg_color character varying(50),
    display_name json,
    is_multilang boolean DEFAULT false NOT NULL,
    is_dashboard boolean DEFAULT true NOT NULL,
    is_custom boolean DEFAULT true NOT NULL
);


ALTER TABLE public.system_annotations OWNER TO test;

--
-- Name: system_annotations_priority_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.system_annotations_priority_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_annotations_priority_seq OWNER TO test;

--
-- Name: system_annotations_priority_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.system_annotations_priority_seq OWNED BY public.system_annotations.priority;


--
-- Name: system_attachment; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_attachment (
    table_id bigint NOT NULL,
    column_id bigint NOT NULL,
    row_id bigint NOT NULL,
    attachment_uuid uuid NOT NULL,
    ordering bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.system_attachment OWNER TO test;

--
-- Name: system_column_groups; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_column_groups (
    table_id bigint NOT NULL,
    group_column_id bigint NOT NULL,
    grouped_column_id bigint NOT NULL
);


ALTER TABLE public.system_column_groups OWNER TO test;

--
-- Name: system_columns; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_columns (
    table_id bigint NOT NULL,
    column_id bigint NOT NULL,
    column_type character varying(255) NOT NULL,
    user_column_name character varying(255) NOT NULL,
    ordering bigint NOT NULL,
    link_id bigint,
    multilanguage character varying(255),
    identifier boolean DEFAULT false,
    country_codes text[],
    format_pattern character varying(255),
    separator boolean DEFAULT false NOT NULL,
    attributes json DEFAULT '{}'::json NOT NULL,
    rules json DEFAULT '[]'::json NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    max_length integer,
    min_length integer,
    show_member_columns boolean DEFAULT false,
    decimal_digits integer
);


ALTER TABLE public.system_columns OWNER TO test;

--
-- Name: system_columns_column_id_table_1; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.system_columns_column_id_table_1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_columns_column_id_table_1 OWNER TO test;

--
-- Name: system_columns_lang; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_columns_lang (
    table_id bigint NOT NULL,
    column_id bigint NOT NULL,
    langtag character varying(50) NOT NULL,
    name character varying(255),
    description text
);


ALTER TABLE public.system_columns_lang OWNER TO test;

--
-- Name: system_link_table; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_link_table (
    link_id bigint NOT NULL,
    table_id_1 bigint,
    table_id_2 bigint,
    cardinality_1 integer DEFAULT 0,
    cardinality_2 integer DEFAULT 0,
    delete_cascade boolean DEFAULT false,
    archive_cascade boolean DEFAULT false,
    final_cascade boolean DEFAULT false,
    CONSTRAINT system_link_table_cardinality_1_check CHECK ((cardinality_1 >= 0)),
    CONSTRAINT system_link_table_cardinality_2_check CHECK ((cardinality_2 >= 0))
);


ALTER TABLE public.system_link_table OWNER TO test;

--
-- Name: system_link_table_link_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.system_link_table_link_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_link_table_link_id_seq OWNER TO test;

--
-- Name: system_link_table_link_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.system_link_table_link_id_seq OWNED BY public.system_link_table.link_id;


--
-- Name: system_services; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_services (
    id bigint NOT NULL,
    type character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    ordering bigint,
    displayname json,
    description json,
    active boolean DEFAULT true,
    config jsonb,
    scope jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.system_services OWNER TO test;

--
-- Name: system_services_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.system_services_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_services_id_seq OWNER TO test;

--
-- Name: system_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.system_services_id_seq OWNED BY public.system_services.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_settings (
    key character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.system_settings OWNER TO test;

--
-- Name: system_table; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_table (
    table_id bigint NOT NULL,
    user_table_name character varying(255) NOT NULL,
    is_hidden boolean DEFAULT false,
    ordering bigint,
    langtags text[],
    type text,
    group_id bigint,
    attributes json DEFAULT '{}'::json NOT NULL,
    concat_format_pattern character varying(255)
);


ALTER TABLE public.system_table OWNER TO test;

--
-- Name: system_table_lang; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_table_lang (
    table_id bigint NOT NULL,
    langtag character varying(50) NOT NULL,
    name character varying(255),
    description text
);


ALTER TABLE public.system_table_lang OWNER TO test;

--
-- Name: system_table_table_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.system_table_table_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_table_table_id_seq OWNER TO test;

--
-- Name: system_table_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.system_table_table_id_seq OWNED BY public.system_table.table_id;


--
-- Name: system_tablegroup; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_tablegroup (
    id bigint NOT NULL
);


ALTER TABLE public.system_tablegroup OWNER TO test;

--
-- Name: system_tablegroup_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.system_tablegroup_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_tablegroup_id_seq OWNER TO test;

--
-- Name: system_tablegroup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.system_tablegroup_id_seq OWNED BY public.system_tablegroup.id;


--
-- Name: system_tablegroup_lang; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_tablegroup_lang (
    id bigint NOT NULL,
    langtag character varying(50) NOT NULL,
    name character varying(255),
    description text
);


ALTER TABLE public.system_tablegroup_lang OWNER TO test;

--
-- Name: system_union_column; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_union_column (
    table_id bigint NOT NULL,
    column_id bigint NOT NULL,
    origin_table_id bigint NOT NULL,
    origin_column_id bigint NOT NULL
);


ALTER TABLE public.system_union_column OWNER TO test;

--
-- Name: system_union_table; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_union_table (
    table_id bigint NOT NULL,
    origin_table_id bigint NOT NULL,
    ordering bigint
);


ALTER TABLE public.system_union_table OWNER TO test;

--
-- Name: system_version; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.system_version (
    version integer NOT NULL,
    updated timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_version OWNER TO test;

--
-- Name: user_settings_filter; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.user_settings_filter (
    id bigint NOT NULL,
    key character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    value jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.user_settings_filter OWNER TO test;

--
-- Name: user_settings_filter_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.user_settings_filter_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_settings_filter_id_seq OWNER TO test;

--
-- Name: user_settings_filter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.user_settings_filter_id_seq OWNED BY public.user_settings_filter.id;


--
-- Name: user_settings_global; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.user_settings_global (
    key character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    value jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.user_settings_global OWNER TO test;

--
-- Name: user_settings_table; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.user_settings_table (
    key character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    table_id bigint NOT NULL,
    value jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone
);


ALTER TABLE public.user_settings_table OWNER TO test;

--
-- Name: user_table_1; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.user_table_1 (
    id bigint NOT NULL,
    final boolean DEFAULT false,
    archived boolean DEFAULT false,
    row_permissions jsonb,
    replaced_ids jsonb
);


ALTER TABLE public.user_table_1 OWNER TO test;

--
-- Name: user_table_1_id_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.user_table_1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_table_1_id_seq OWNER TO test;

--
-- Name: user_table_1_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.user_table_1_id_seq OWNED BY public.user_table_1.id;


--
-- Name: user_table_annotations_1; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.user_table_annotations_1 (
    row_id bigint NOT NULL,
    column_id bigint NOT NULL,
    uuid uuid NOT NULL,
    langtags text[] DEFAULT '{}'::text[] NOT NULL,
    type character varying(255) NOT NULL,
    value text,
    annotation_name text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_table_annotations_1 OWNER TO test;

--
-- Name: user_table_history_1; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.user_table_history_1 (
    revision bigint NOT NULL,
    row_id bigint NOT NULL,
    column_id bigint,
    event character varying(255) DEFAULT 'cell_changed'::character varying NOT NULL,
    history_type character varying(255),
    value_type character varying(255),
    language_type character varying(255) DEFAULT 'neutral'::character varying,
    author character varying(255),
    "timestamp" timestamp without time zone DEFAULT now(),
    value jsonb,
    deleted_at timestamp without time zone
);


ALTER TABLE public.user_table_history_1 OWNER TO test;

--
-- Name: user_table_history_1_revision_seq; Type: SEQUENCE; Schema: public; Owner: test
--

CREATE SEQUENCE public.user_table_history_1_revision_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_table_history_1_revision_seq OWNER TO test;

--
-- Name: user_table_history_1_revision_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test
--

ALTER SEQUENCE public.user_table_history_1_revision_seq OWNED BY public.user_table_history_1.revision;


--
-- Name: user_table_lang_1; Type: TABLE; Schema: public; Owner: test
--

CREATE TABLE public.user_table_lang_1 (
    id bigint NOT NULL,
    langtag character varying(255) NOT NULL,
    column_1 text
);


ALTER TABLE public.user_table_lang_1 OWNER TO test;

--
-- Name: folder id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.folder ALTER COLUMN id SET DEFAULT nextval('public.folder_id_seq'::regclass);


--
-- Name: system_annotations priority; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_annotations ALTER COLUMN priority SET DEFAULT nextval('public.system_annotations_priority_seq'::regclass);


--
-- Name: system_link_table link_id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_link_table ALTER COLUMN link_id SET DEFAULT nextval('public.system_link_table_link_id_seq'::regclass);


--
-- Name: system_services id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_services ALTER COLUMN id SET DEFAULT nextval('public.system_services_id_seq'::regclass);


--
-- Name: system_table table_id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_table ALTER COLUMN table_id SET DEFAULT nextval('public.system_table_table_id_seq'::regclass);


--
-- Name: system_table ordering; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_table ALTER COLUMN ordering SET DEFAULT currval('public.system_table_table_id_seq'::regclass);


--
-- Name: system_tablegroup id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_tablegroup ALTER COLUMN id SET DEFAULT nextval('public.system_tablegroup_id_seq'::regclass);


--
-- Name: user_settings_filter id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_settings_filter ALTER COLUMN id SET DEFAULT nextval('public.user_settings_filter_id_seq'::regclass);


--
-- Name: user_table_1 id; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_1 ALTER COLUMN id SET DEFAULT nextval('public.user_table_1_id_seq'::regclass);


--
-- Name: user_table_history_1 revision; Type: DEFAULT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_history_1 ALTER COLUMN revision SET DEFAULT nextval('public.user_table_history_1_revision_seq'::regclass);


--
-- Data for Name: file; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.file (uuid, idfolder, tmp, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: file_lang; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.file_lang (uuid, langtag, title, description, internal_name, external_name, mime_type) FROM stdin;
\.


--
-- Data for Name: folder; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.folder (id, name, description, idparent, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_annotations; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_annotations (name, priority, fg_color, bg_color, display_name, is_multilang, is_dashboard, is_custom) FROM stdin;
important	1	#ffffff	#ff7474	{"de":"Wichtig","en":"Important"}	f	t	t
check-me	2	#ffffff	#c274ff	{"de":"Bitte überprüfen","en":"Please double-check"}	f	t	f
postpone	3	#ffffff	#999999	{"de":"Später","en":"Later"}	f	t	t
needs_translation	4	#ffffff	#ffae74	{"de":"Übersetzung nötig","en":"Translation necessary"}	t	t	f
\.


--
-- Data for Name: system_attachment; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_attachment (table_id, column_id, row_id, attachment_uuid, ordering, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_column_groups; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_column_groups (table_id, group_column_id, grouped_column_id) FROM stdin;
\.


--
-- Data for Name: system_columns; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_columns (table_id, column_id, column_type, user_column_name, ordering, link_id, multilanguage, identifier, country_codes, format_pattern, separator, attributes, rules, hidden, max_length, min_length, show_member_columns, decimal_digits) FROM stdin;
1	1	shorttext	identifier	1	\N	language	t	\N	\N	t	{}	[]	f	\N	\N	f	\N
\.


--
-- Data for Name: system_columns_lang; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_columns_lang (table_id, column_id, langtag, name, description) FROM stdin;
1	1	de-DE	Bezeichnung	\N
1	1	en-GB	Identifier	\N
1	1	fr-FR	Désignation	\N
1	1	es-ES	Descripción	\N
\.


--
-- Data for Name: system_link_table; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_link_table (link_id, table_id_1, table_id_2, cardinality_1, cardinality_2, delete_cascade, archive_cascade, final_cascade) FROM stdin;
\.


--
-- Data for Name: system_services; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_services (id, type, name, ordering, displayname, description, active, config, scope, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_settings (key, value) FROM stdin;
langtags	["de-DE", "en-GB"]
\.


--
-- Data for Name: system_table; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_table (table_id, user_table_name, is_hidden, ordering, langtags, type, group_id, attributes, concat_format_pattern) FROM stdin;
1	material	f	1	\N	generic	\N	{}	\N
\.


--
-- Data for Name: system_table_lang; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_table_lang (table_id, langtag, name, description) FROM stdin;
1	de-DE	Material	\N
1	en-GB	Material	\N
1	fr-FR	Matériau	\N
1	es-ES	Material	\N
\.


--
-- Data for Name: system_tablegroup; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_tablegroup (id) FROM stdin;
\.


--
-- Data for Name: system_tablegroup_lang; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_tablegroup_lang (id, langtag, name, description) FROM stdin;
\.


--
-- Data for Name: system_union_column; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_union_column (table_id, column_id, origin_table_id, origin_column_id) FROM stdin;
\.


--
-- Data for Name: system_union_table; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_union_table (table_id, origin_table_id, ordering) FROM stdin;
\.


--
-- Data for Name: system_version; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.system_version (version, updated) FROM stdin;
35	2026-03-03 11:31:35.117416+00
36	2026-03-03 11:31:35.154071+00
37	2026-03-03 11:31:35.154071+00
38	2026-03-03 11:31:35.154071+00
39	2026-03-03 11:31:35.154071+00
40	2026-03-03 11:31:35.154071+00
41	2026-03-03 11:31:35.154071+00
42	2026-03-03 11:31:35.154071+00
\.


--
-- Data for Name: user_settings_filter; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.user_settings_filter (id, key, user_id, name, value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_settings_global; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.user_settings_global (key, user_id, value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_settings_table; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.user_settings_table (key, user_id, table_id, value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_table_1; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.user_table_1 (id, final, archived, row_permissions, replaced_ids) FROM stdin;
\.


--
-- Data for Name: user_table_annotations_1; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.user_table_annotations_1 (row_id, column_id, uuid, langtags, type, value, annotation_name, created_at) FROM stdin;
\.


--
-- Data for Name: user_table_history_1; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.user_table_history_1 (revision, row_id, column_id, event, history_type, value_type, language_type, author, "timestamp", value, deleted_at) FROM stdin;
\.


--
-- Data for Name: user_table_lang_1; Type: TABLE DATA; Schema: public; Owner: test
--

COPY public.user_table_lang_1 (id, langtag, column_1) FROM stdin;
\.


--
-- Name: folder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.folder_id_seq', 1, false);


--
-- Name: system_annotations_priority_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.system_annotations_priority_seq', 1, false);


--
-- Name: system_columns_column_id_table_1; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.system_columns_column_id_table_1', 1, true);


--
-- Name: system_link_table_link_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.system_link_table_link_id_seq', 1, false);


--
-- Name: system_services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.system_services_id_seq', 1, false);


--
-- Name: system_table_table_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.system_table_table_id_seq', 1, true);


--
-- Name: system_tablegroup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.system_tablegroup_id_seq', 1, false);


--
-- Name: user_settings_filter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.user_settings_filter_id_seq', 1, false);


--
-- Name: user_table_1_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.user_table_1_id_seq', 1, false);


--
-- Name: user_table_history_1_revision_seq; Type: SEQUENCE SET; Schema: public; Owner: test
--

SELECT pg_catalog.setval('public.user_table_history_1_revision_seq', 1, false);


--
-- Name: file_lang file_lang_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.file_lang
    ADD CONSTRAINT file_lang_pkey PRIMARY KEY (uuid, langtag);


--
-- Name: file file_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_pkey PRIMARY KEY (uuid);


--
-- Name: folder folder_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.folder
    ADD CONSTRAINT folder_pkey PRIMARY KEY (id);


--
-- Name: system_annotations system_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_annotations
    ADD CONSTRAINT system_annotations_pkey PRIMARY KEY (name);


--
-- Name: system_attachment system_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_attachment
    ADD CONSTRAINT system_attachment_pkey PRIMARY KEY (table_id, column_id, row_id, attachment_uuid);


--
-- Name: system_column_groups system_column_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_column_groups
    ADD CONSTRAINT system_column_groups_pkey PRIMARY KEY (table_id, group_column_id, grouped_column_id);


--
-- Name: system_columns_lang system_columns_lang_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_columns_lang
    ADD CONSTRAINT system_columns_lang_pkey PRIMARY KEY (table_id, column_id, langtag);


--
-- Name: system_columns system_columns_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_columns
    ADD CONSTRAINT system_columns_pkey PRIMARY KEY (table_id, column_id);


--
-- Name: system_link_table system_link_table_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_link_table
    ADD CONSTRAINT system_link_table_pkey PRIMARY KEY (link_id);


--
-- Name: system_services system_services_name_key; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_services
    ADD CONSTRAINT system_services_name_key UNIQUE (name);


--
-- Name: system_services system_services_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_services
    ADD CONSTRAINT system_services_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: system_table_lang system_table_lang_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_table_lang
    ADD CONSTRAINT system_table_lang_pkey PRIMARY KEY (table_id, langtag);


--
-- Name: system_table system_table_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_table
    ADD CONSTRAINT system_table_pkey PRIMARY KEY (table_id);


--
-- Name: system_tablegroup_lang system_tablegroup_lang_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_tablegroup_lang
    ADD CONSTRAINT system_tablegroup_lang_pkey PRIMARY KEY (id, langtag);


--
-- Name: system_tablegroup system_tablegroup_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_tablegroup
    ADD CONSTRAINT system_tablegroup_pkey PRIMARY KEY (id);


--
-- Name: system_union_column system_union_column_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_column
    ADD CONSTRAINT system_union_column_pkey PRIMARY KEY (table_id, column_id, origin_table_id, origin_column_id);


--
-- Name: system_union_table system_union_table_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_table
    ADD CONSTRAINT system_union_table_pkey PRIMARY KEY (table_id, origin_table_id);


--
-- Name: system_version system_version_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_version
    ADD CONSTRAINT system_version_pkey PRIMARY KEY (version);


--
-- Name: user_settings_filter user_settings_filter_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_settings_filter
    ADD CONSTRAINT user_settings_filter_pkey PRIMARY KEY (id);


--
-- Name: user_settings_global user_settings_global_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_settings_global
    ADD CONSTRAINT user_settings_global_pkey PRIMARY KEY (key, user_id);


--
-- Name: user_settings_table user_settings_table_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_settings_table
    ADD CONSTRAINT user_settings_table_pkey PRIMARY KEY (key, user_id, table_id);


--
-- Name: user_table_1 user_table_1_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_1
    ADD CONSTRAINT user_table_1_pkey PRIMARY KEY (id);


--
-- Name: user_table_annotations_1 user_table_annotations_1_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_annotations_1
    ADD CONSTRAINT user_table_annotations_1_pkey PRIMARY KEY (row_id, column_id, uuid);


--
-- Name: user_table_history_1 user_table_history_1_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_history_1
    ADD CONSTRAINT user_table_history_1_pkey PRIMARY KEY (revision);


--
-- Name: user_table_lang_1 user_table_lang_1_pkey; Type: CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_lang_1
    ADD CONSTRAINT user_table_lang_1_pkey PRIMARY KEY (id, langtag);


--
-- Name: idx_user_table_history_1_col_id; Type: INDEX; Schema: public; Owner: test
--

CREATE INDEX idx_user_table_history_1_col_id ON public.user_table_history_1 USING btree (column_id);


--
-- Name: idx_user_table_history_1_row_col_id; Type: INDEX; Schema: public; Owner: test
--

CREATE INDEX idx_user_table_history_1_row_col_id ON public.user_table_history_1 USING btree (row_id, column_id);


--
-- Name: idx_user_table_history_1_row_id; Type: INDEX; Schema: public; Owner: test
--

CREATE INDEX idx_user_table_history_1_row_id ON public.user_table_history_1 USING btree (row_id);


--
-- Name: system_columns_name; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX system_columns_name ON public.system_columns USING btree (table_id, user_column_name);


--
-- Name: system_folder_name; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX system_folder_name ON public.folder USING btree (name, idparent);


--
-- Name: system_table_name; Type: INDEX; Schema: public; Owner: test
--

CREATE UNIQUE INDEX system_table_name ON public.system_table USING btree (user_table_name);


--
-- Name: user_settings_filter user_settings_filter__trigger__updated_at; Type: TRIGGER; Schema: public; Owner: test
--

CREATE TRIGGER user_settings_filter__trigger__updated_at BEFORE UPDATE ON public.user_settings_filter FOR EACH ROW EXECUTE FUNCTION public.trigger__set_updated_at__if_modified();


--
-- Name: user_settings_global user_settings_global__trigger__updated_at; Type: TRIGGER; Schema: public; Owner: test
--

CREATE TRIGGER user_settings_global__trigger__updated_at BEFORE UPDATE ON public.user_settings_global FOR EACH ROW EXECUTE FUNCTION public.trigger__set_updated_at__if_modified();


--
-- Name: user_settings_table user_settings_table__trigger__updated_at; Type: TRIGGER; Schema: public; Owner: test
--

CREATE TRIGGER user_settings_table__trigger__updated_at BEFORE UPDATE ON public.user_settings_table FOR EACH ROW EXECUTE FUNCTION public.trigger__set_updated_at__if_modified();


--
-- Name: file file_idfolder_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_idfolder_fkey FOREIGN KEY (idfolder) REFERENCES public.folder(id);


--
-- Name: file_lang file_lang_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.file_lang
    ADD CONSTRAINT file_lang_uuid_fkey FOREIGN KEY (uuid) REFERENCES public.file(uuid) ON DELETE CASCADE;


--
-- Name: system_union_column fk_union_column_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_column
    ADD CONSTRAINT fk_union_column_fkey FOREIGN KEY (table_id, column_id) REFERENCES public.system_columns(table_id, column_id) ON DELETE CASCADE;


--
-- Name: system_union_column fk_union_origin_column_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_column
    ADD CONSTRAINT fk_union_origin_column_fkey FOREIGN KEY (origin_table_id, origin_column_id) REFERENCES public.system_columns(table_id, column_id) ON DELETE CASCADE;


--
-- Name: system_union_column fk_union_table_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_column
    ADD CONSTRAINT fk_union_table_fkey FOREIGN KEY (table_id, origin_table_id) REFERENCES public.system_union_table(table_id, origin_table_id) ON DELETE CASCADE;


--
-- Name: folder folder_idparent_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.folder
    ADD CONSTRAINT folder_idparent_fkey FOREIGN KEY (idparent) REFERENCES public.folder(id);


--
-- Name: system_attachment system_attachment_attachment_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_attachment
    ADD CONSTRAINT system_attachment_attachment_uuid_fkey FOREIGN KEY (attachment_uuid) REFERENCES public.file(uuid) ON DELETE CASCADE;


--
-- Name: system_attachment system_attachment_table_id_column_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_attachment
    ADD CONSTRAINT system_attachment_table_id_column_id_fkey FOREIGN KEY (table_id, column_id) REFERENCES public.system_columns(table_id, column_id) ON DELETE CASCADE;


--
-- Name: system_attachment system_attachment_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_attachment
    ADD CONSTRAINT system_attachment_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_column_groups system_column_groups_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_column_groups
    ADD CONSTRAINT system_column_groups_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_column_groups system_column_groups_table_id_group_column_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_column_groups
    ADD CONSTRAINT system_column_groups_table_id_group_column_id_fkey FOREIGN KEY (table_id, group_column_id) REFERENCES public.system_columns(table_id, column_id) ON DELETE CASCADE;


--
-- Name: system_column_groups system_column_groups_table_id_grouped_column_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_column_groups
    ADD CONSTRAINT system_column_groups_table_id_grouped_column_id_fkey FOREIGN KEY (table_id, grouped_column_id) REFERENCES public.system_columns(table_id, column_id) ON DELETE CASCADE;


--
-- Name: system_columns_lang system_columns_lang_table_id_column_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_columns_lang
    ADD CONSTRAINT system_columns_lang_table_id_column_id_fkey FOREIGN KEY (table_id, column_id) REFERENCES public.system_columns(table_id, column_id) ON DELETE CASCADE;


--
-- Name: system_columns_lang system_columns_lang_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_columns_lang
    ADD CONSTRAINT system_columns_lang_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_columns system_columns_link_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_columns
    ADD CONSTRAINT system_columns_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.system_link_table(link_id) ON DELETE CASCADE;


--
-- Name: system_columns system_columns_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_columns
    ADD CONSTRAINT system_columns_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_link_table system_link_table_table_id_1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_link_table
    ADD CONSTRAINT system_link_table_table_id_1_fkey FOREIGN KEY (table_id_1) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_link_table system_link_table_table_id_2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_link_table
    ADD CONSTRAINT system_link_table_table_id_2_fkey FOREIGN KEY (table_id_2) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_table system_table_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_table
    ADD CONSTRAINT system_table_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.system_tablegroup(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: system_table_lang system_table_lang_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_table_lang
    ADD CONSTRAINT system_table_lang_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_tablegroup_lang system_tablegroup_lang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_tablegroup_lang
    ADD CONSTRAINT system_tablegroup_lang_id_fkey FOREIGN KEY (id) REFERENCES public.system_tablegroup(id) ON DELETE CASCADE;


--
-- Name: system_union_column system_union_column_origin_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_column
    ADD CONSTRAINT system_union_column_origin_table_id_fkey FOREIGN KEY (origin_table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_union_column system_union_column_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_column
    ADD CONSTRAINT system_union_column_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_union_table system_union_table_origin_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_table
    ADD CONSTRAINT system_union_table_origin_table_id_fkey FOREIGN KEY (origin_table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: system_union_table system_union_table_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.system_union_table
    ADD CONSTRAINT system_union_table_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.system_table(table_id) ON DELETE CASCADE;


--
-- Name: user_table_annotations_1 user_table_annotations_1_annotation_name_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_annotations_1
    ADD CONSTRAINT user_table_annotations_1_annotation_name_fkey FOREIGN KEY (annotation_name) REFERENCES public.system_annotations(name) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_table_annotations_1 user_table_annotations_1_row_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_annotations_1
    ADD CONSTRAINT user_table_annotations_1_row_id_fkey FOREIGN KEY (row_id) REFERENCES public.user_table_1(id) ON DELETE CASCADE;


--
-- Name: user_table_lang_1 user_table_lang_1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test
--

ALTER TABLE ONLY public.user_table_lang_1
    ADD CONSTRAINT user_table_lang_1_id_fkey FOREIGN KEY (id) REFERENCES public.user_table_1(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: test
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict dbP73afzreKeTgKgxXjxah3dloCPogyr5qXcZ68lnaFdqapz0JYUsfhgTW6fGce

