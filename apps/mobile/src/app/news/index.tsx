import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Screen } from '../../components/Screen';
import { NewsFeed } from '../../features/NewsFeed';

export default function News() {
  const { t } = useI18n();
  return (
    <Screen title={t('news.title')}>
      <NewsFeed />
    </Screen>
  );
}
