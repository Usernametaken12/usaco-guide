import { graphql, PageProps } from 'gatsby';
import React, { useEffect, useRef } from 'react';

import {
  HitsPerPage,
  InstantSearch,
  Pagination,
  PoweredBy,
  useHits,
  useRefinementList,
} from 'react-instantsearch';

import SECTIONS from '../../content/ordering';
import Layout from '../components/layout';
import ProblemHits from '../components/ProblemsPage/ProblemHits';
import RefinementList from '../components/ProblemsPage/RefinementList';
import SearchBox from '../components/ProblemsPage/SearchBox';
import Selection, {
  SelectionProps,
} from '../components/ProblemsPage/Selection';
import SEO from '../components/seo';
import TopNavigationBar from '../components/TopNavigationBar/TopNavigationBar';
import { useUserProgressOnProblems } from '../context/UserDataContext/properties/userProgress';
import { searchClient } from '../utils/algoliaSearchClient';

const indexName = `${process.env.GATSBY_ALGOLIA_INDEX_NAME ?? 'dev'}_problems`;

const CustomHits = connectHits(ProblemHits);
const CustomRefinementList = connectRefinementList(RefinementList);

type DataProps = {
  allProblemInfo: {
    nodes: {
      uniqueId: string;
    }[];
  };
};

export default function ProblemsPage(props: PageProps<DataProps>) {
  const {
    allProblemInfo: { nodes: problems },
  } = props.data;
  const problemIds = problems.map(problem => problem.uniqueId);
  const userProgress = useUserProgressOnProblems();
  const progressToIds = useRef<{ [key: string]: string[] }>({});
  useEffect(() => {
    for (const id of problemIds) {
      const progress = userProgress[id] ?? 'Not Attempted';
      if (!progressToIds.current[progress]) {
        progressToIds.current[progress] = [];
      }
      progressToIds.current[progress].push(id);
    }
  }, []);
  const selectionMetadata: SelectionProps[] = [
    {
      attribute: 'difficulty',
      limit: 500,
      placeholder: 'Difficulty',
      searchable: false,
      isMulti: true,
    },
    {
      attribute: 'problemModules.title',
      limit: 500,
      placeholder: 'Modules',
      searchable: true,
      isMulti: true,
    },
    {
      attribute: 'source',
      limit: 500,
      placeholder: 'Source',
      searchable: true,
      isMulti: true,
    },
    {
      attribute: 'isStarred',
      limit: 500,
      placeholder: 'Starred',
      searchable: false,
      transformLabel: label => (label == 'true' ? 'Yes' : 'No'),
      isMulti: false,
    },
    {
      attribute: 'problemModules.id',
      limit: 500,
      placeholder: 'Section',
      searchable: false,
      isMulti: true,
      items: [
        {
          label: 'General',
          value: SECTIONS.general.map(chapter => chapter.items).flat(),
        },
        {
          label: 'Bronze',
          value: SECTIONS.bronze.map(chapter => chapter.items).flat(),
        },
        {
          label: 'Silver',
          value: SECTIONS.silver.map(chapter => chapter.items).flat(),
        },
        {
          label: 'Gold',
          value: SECTIONS.gold.map(chapter => chapter.items).flat(),
        },
        {
          label: 'Platinum',
          value: SECTIONS.plat.map(chapter => chapter.items).flat(),
        },
        {
          label: 'Advanced',
          value: SECTIONS.adv.map(chapter => chapter.items).flat(),
        },
      ],
    },
    {
      attribute: 'objectID',
      limit: 500,
      placeholder: 'Status',
      searchable: false,
      isMulti: true,
      items: [
        'Not Attempted',
        'Solving',
        'Reviewing',
        'Skipped',
        'Ignored',
      ].map(label => ({
        label,
        value: progressToIds.current[label] ?? [],
      })),
    },
  ];
  return (
    <Layout>
      <SEO title="All Problems" />

      <div className="min-h-screen bg-gray-100 dark:bg-dark-surface">
        <TopNavigationBar />

        <InstantSearch searchClient={searchClient} indexName={indexName}>
          <div className="py-16 bg-blue-600 dark:bg-blue-900 px-5">
            <div className="max-w-3xl mx-auto mb-6">
              <h1 className="text-center text-3xl sm:text-5xl font-bold text-white dark:text-dark-high-emphasis mb-6">
                Problems (Beta)
              </h1>
              <SearchBox />
            </div>
          </div>
          <div className="flex mt-4 mb-1 mx-9 justify-center">
            <PoweredBy />
          </div>
          <div className="pt-3 px-9 pb-4 grid grid-cols-10">
            <div className="sm:col-span-4 md:col-span-3 lg:col-span-2 xl:col-span-2 col-span-5 overflow-y-auto">
              <CustomRefinementList attribute="tags" limit={500} searchable />
            </div>
            <div className="py-0.5 px-1 sm:col-span-6 md:col-span-6 lg:col-span-6 xl:col-span-8 col-span-5 overflow-y-auto">
              <div className="mb-5 items-center grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-x-5 gap-y-3">
                {selectionMetadata.map(props => (
                  <div
                    className="sm:col-span-3 col-span-2 md:col-span-1 lg:col-span-2 tw-forms-disable-all-descendants"
                    key={props.attribute}
                  >
                    <Selection {...props} />
                  </div>
                ))}
              </div>
              <CustomHits />
              <div className="mt-3 flex flex-wrap justify-center">
                <Pagination showLast={true} className="pr-4" />
                <HitsPerPage
                  items={[
                    { label: '24 hits per page', value: 24, default: true },
                    { label: '32 hits per page', value: 32 },
                    { label: '48 hits per page', value: 48 },
                  ]}
                  className="mt-1 lg:mt-0"
                />
              </div>
            </div>
          </div>
        </InstantSearch>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query {
    allProblemInfo {
      nodes {
        uniqueId
      }
    }
  }
`;

function connectHits(Component) {
  const Hits = props => {
    const data = useHits(props);

    return <Component {...props} {...data} />;
  };

  return Hits;
}

function connectRefinementList(Component) {
  const RefinementList = props => {
    const data = useRefinementList(props);

    return <Component {...props} {...data} />;
  };

  return RefinementList;
}
