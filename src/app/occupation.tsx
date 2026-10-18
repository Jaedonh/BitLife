import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, ListRow, Screen, Section, StatBar, T } from '@/components/ui';
import { HUSTLE_BY_ID } from '@/data/hustles';
import { JOB_BY_ID } from '@/data/jobs';
import { GRAD_BY_ID, MAJOR_BY_ID } from '@/data/majors';
import { dropOutBlocker, enrollOptions, hustleOptions, meetsRequirements, skipClassBlocker, STAGE_LABELS } from '@/engine';
import { employerLabel, formatMoney, formatMoneyFull } from '@/engine/util';
import { useRewarded } from '@/hooks/useRewarded';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing } from '@/theme';

/** How a past job ended, in the work history. */
const HISTORY_REASON: Record<string, string> = { quit: 'quit', fired: 'let go', promoted: 'promoted', retired: 'retired', left: 'moved on' };

export default function OccupationScreen() {
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const premium = useSettingsStore((s) => s.premium);
  const { notice: rewardedNotice, run: runRewarded } = useRewarded();
  const [showAllJobs, setShowAllJobs] = useState(false);
  if (!game) return <Redirect href="/" />;
  const cc = game.character.countryCode;
  const job = game.career.job;
  const edu = game.education;
  const options = enrollOptions(game);
  const hustles = hustleOptions(game);
  const skipBlocked = edu.enrolled ? skipClassBlocker(game) : null;
  const canDropOut = edu.enrolled && !dropOutBlocker(game);
  const hustleEnergy = game.career.hustle ? (HUSTLE_BY_ID[game.career.hustle.defId]?.energy ?? 0) : 0;
  const listings = game.career.listings;
  const visibleListings = showAllJobs ? listings : listings.slice(0, 8);

  return (
    <Screen>
      <ScreenHeader title="Work & School" subtitle={job ? `${job.title} · ${employerLabel(job.company)}` : edu.enrolled ? STAGE_LABELS[edu.stage] : game.character.age < 14 ? 'Too young to work' : 'Looking for work'} />
      <ScrollView contentContainerStyle={styles.content}>
        {game.crime.inPrison ? (
          <Card>
            <T kind="subheading">🔒 In prison</T>
            <T kind="small">{game.crime.sentenceYearsLeft} {game.crime.sentenceYearsLeft === 1 ? 'year' : 'years'} left on your sentence. No work or school until you are released.</T>
          </Card>
        ) : null}

        {edu.enrolled ? (
          <Section title="School">
            <Card style={styles.card}>
              <T kind="subheading">{STAGE_LABELS[edu.stage]}{edu.major ? ` · ${MAJOR_BY_ID[edu.major]?.name ?? GRAD_BY_ID[edu.major]?.name ?? edu.major.replace(/_/g, ' ')}` : ''}</T>
              <StatBar label="Grade" value={edu.grade} color={colors.smarts} />
              {edu.studentDebt > 0 ? <T kind="small">Student loans: {formatMoneyFull(edu.studentDebt, cc)}</T> : null}
              {edu.scholarship ? <T kind="small">🎓 Scholarship: tuition covered.</T> : null}
              <View style={styles.row}>
                <Button title="Study harder" size="sm" onPress={() => act({ type: 'study' })} disabled={edu.studiedThisYear} style={styles.flex} testID="study" />
                <Button title="Skip class" size="sm" variant="secondary" onPress={() => act({ type: 'skipClass' })} disabled={!!skipBlocked} style={styles.flex} testID="skip-class" />
                {canDropOut ? <Button title="Drop out" size="sm" variant="danger" onPress={() => act({ type: 'dropOut' })} style={styles.flex} testID="drop-out" /> : null}
              </View>
              {skipBlocked ? <T kind="small">{skipBlocked}</T> : null}
            </Card>
          </Section>
        ) : null}

        {!edu.enrolled && options.length ? (
          <Section title={options[0]?.kind === 'graduate' ? 'Graduate school' : 'University'}>
            {options.map((o) => (
              <ListRow key={o.id} title={o.name} subtitle={`${o.years} years · ${formatMoney(o.tuition, cc)}/yr${o.reason ? ` · ${o.reason}` : ''}`} onPress={o.eligible ? () => act({ type: 'enroll', major: o.id }) : undefined} disabled={!o.eligible} emoji="🎓" testID={`enroll-${o.id}`} />
            ))}
          </Section>
        ) : null}

        {job ? (
          <Section title="Current job">
            <Card style={styles.card}>
              <T kind="subheading">
                {JOB_BY_ID[job.defId]?.emoji ?? '💼'} {job.title}
              </T>
              <T kind="small">
                {employerLabel(job.company)} · {formatMoneyFull(job.salary, cc)}/yr · {job.yearsHeld} {job.yearsHeld === 1 ? 'year' : 'years'}
              </T>
              <StatBar label="Performance" value={job.performance} color={colors.accent} />
              <View style={styles.row}>
                <Button title="Work harder" size="sm" onPress={() => act({ type: 'workHarder' })} disabled={job.workedHarderThisYear} style={styles.flex} testID="work-harder" />
                <Button title="Ask for a raise" size="sm" variant="secondary" onPress={() => act({ type: 'askRaise' })} disabled={job.askedThisYear} style={styles.flex} testID="ask-raise" />
              </View>
              <View style={styles.row}>
                <Button title="Ask for a promotion" size="sm" variant="secondary" onPress={() => act({ type: 'askPromotion' })} disabled={job.askedThisYear} style={styles.flex} testID="ask-promotion" />
                {game.character.age >= 60 ? (
                  <Button title="Retire" size="sm" variant="secondary" onPress={() => act({ type: 'retire' })} style={styles.flex} testID="retire" />
                ) : (
                  <Button title="Quit" size="sm" variant="danger" onPress={() => act({ type: 'quitJob' })} style={styles.flex} testID="quit-job" />
                )}
              </View>
            </Card>
          </Section>
        ) : null}

        {game.career.hustle ? (
          <Section title="Side hustle">
            <Card style={styles.card}>
              <T kind="subheading">{game.career.hustle.name} · Level {game.career.hustle.level}/5</T>
              <T kind="small">Last year: {formatMoneyFull(game.career.hustle.lastIncome, cc)}{hustleEnergy ? ` · Takes ${hustleEnergy} energy a year` : ''}</T>
              <Button title="Shut it down" size="sm" variant="danger" onPress={() => act({ type: 'stopHustle' })} testID="stop-hustle" />
            </Card>
          </Section>
        ) : game.character.age >= 13 && !game.crime.inPrison ? (
          <Section title="Start a side hustle">
            {hustles.map(({ def, eligible, reason }) => (
              <ListRow key={def.id} emoji={def.emoji} title={def.name} subtitle={eligible ? def.description : reason} onPress={eligible ? () => act({ type: 'startHustle', defId: def.id }) : undefined} disabled={!eligible} testID={`hustle-${def.id}`} />
            ))}
          </Section>
        ) : null}

        {game.character.age >= 14 && !game.crime.inPrison ? (
          <Section
            title="Job listings"
            right={
              canUseRewarded('reroll') ? (
                <Button title={premium ? '✨ New listings' : '📺 New listings'} size="sm" variant="ghost" onPress={() => void runRewarded('reroll')} testID="reroll-jobs" />
              ) : undefined
            }
          >
            {rewardedNotice ? (
              <T kind="small" testID="rewarded-notice">
                {rewardedNotice}
              </T>
            ) : null}
            {visibleListings.map((l) => {
              const def = JOB_BY_ID[l.defId];
              const req = def ? meetsRequirements(game, def) : { ok: false, reason: 'Unknown' };
              return (
                <ListRow
                  key={l.id}
                  emoji={def?.emoji ?? '💼'}
                  title={`${l.title}${l.partTime ? ' (part-time)' : ''}`}
                  subtitle={`${employerLabel(l.company)}${req.ok ? '' : ` · ${req.reason}`}`}
                  right={formatMoney(l.salary, cc)}
                  onPress={() => act({ type: 'applyJob', listingId: l.id })}
                  disabled={!req.ok}
                  testID={`apply-${l.defId}`}
                />
              );
            })}
            {listings.length > 8 && !showAllJobs ? <Button title={`Show ${listings.length - 8} more`} variant="ghost" size="sm" onPress={() => setShowAllJobs(true)} /> : null}
            {listings.length === 0 ? <T kind="small">No listings yet. Age up to see this year&apos;s jobs.</T> : null}
          </Section>
        ) : null}

        {game.career.history.length ? (
          <Section title="Work history">
            {game.career.history.slice(-5).reverse().map((h, i) => (
              <Text key={i} style={styles.history}>
                {h.title} · {employerLabel(h.company)} · age {h.fromAge}–{h.toAge} · {HISTORY_REASON[h.reason] ?? h.reason}
              </Text>
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  history: { color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.xs },
});
