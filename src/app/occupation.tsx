import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, ListRow, Screen, Section, StatBar, T } from '@/components/ui';
import { JOB_BY_ID } from '@/data/jobs';
import { enrollOptions, hustleOptions, meetsRequirements, STAGE_LABELS } from '@/engine';
import { formatMoney, formatMoneyFull } from '@/engine/util';
import { useGameStore } from '@/store/gameStore';
import { colors, spacing } from '@/theme';

export default function OccupationScreen() {
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  const rewarded = useGameStore((s) => s.rewarded);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const [showAllJobs, setShowAllJobs] = useState(false);
  if (!game) return <Redirect href="/" />;
  const cc = game.character.countryCode;
  const job = game.career.job;
  const edu = game.education;
  const options = enrollOptions(game);
  const hustles = hustleOptions(game);
  const listings = game.career.listings;
  const visibleListings = showAllJobs ? listings : listings.slice(0, 8);

  return (
    <Screen>
      <ScreenHeader title="Work & School" subtitle={job ? `${job.title} at ${job.company}` : edu.enrolled ? STAGE_LABELS[edu.stage] : 'Looking for work'} />
      <ScrollView contentContainerStyle={styles.content}>
        {game.crime.inPrison ? (
          <Card>
            <T kind="subheading">🔒 In prison</T>
            <T kind="small">{game.crime.sentenceYearsLeft} year(s) left on your sentence. No work or school until release.</T>
          </Card>
        ) : null}

        {edu.enrolled ? (
          <Section title="School">
            <Card style={styles.card}>
              <T kind="subheading">{STAGE_LABELS[edu.stage]}{edu.major ? ` · ${edu.major.replace(/_/g, ' ')}` : ''}</T>
              <StatBar label="Grade" value={edu.grade} color={colors.smarts} />
              {edu.studentDebt > 0 ? <T kind="small">Student debt: {formatMoneyFull(edu.studentDebt, cc)}</T> : null}
              {edu.scholarship ? <T kind="small">🎓 Scholarship: tuition covered.</T> : null}
              <View style={styles.row}>
                <Button title="Study harder" size="sm" onPress={() => act({ type: 'study' })} disabled={edu.studiedThisYear} style={styles.flex} testID="study" />
                <Button title="Skip class" size="sm" variant="secondary" onPress={() => act({ type: 'skipClass' })} style={styles.flex} testID="skip-class" />
                <Button title="Drop out" size="sm" variant="danger" onPress={() => act({ type: 'dropOut' })} style={styles.flex} testID="drop-out" />
              </View>
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
                {job.company} · {formatMoneyFull(job.salary, cc)}/yr · {job.yearsHeld} yr{job.yearsHeld === 1 ? '' : 's'}
              </T>
              <StatBar label="Performance" value={job.performance} color={colors.accent} />
              <View style={styles.row}>
                <Button title="Work harder" size="sm" onPress={() => act({ type: 'workHarder' })} disabled={job.workedHarderThisYear} style={styles.flex} testID="work-harder" />
                <Button title="Ask for raise" size="sm" variant="secondary" onPress={() => act({ type: 'askRaise' })} disabled={job.askedThisYear} style={styles.flex} testID="ask-raise" />
              </View>
              <View style={styles.row}>
                <Button title="Ask for promotion" size="sm" variant="secondary" onPress={() => act({ type: 'askPromotion' })} disabled={job.askedThisYear} style={styles.flex} testID="ask-promotion" />
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
              <T kind="subheading">{game.career.hustle.name} · level {game.career.hustle.level}/5</T>
              <T kind="small">Last year: {formatMoneyFull(game.career.hustle.lastIncome, cc)}</T>
              <Button title="Shut it down" size="sm" variant="danger" onPress={() => act({ type: 'stopHustle' })} testID="stop-hustle" />
            </Card>
          </Section>
        ) : game.character.age >= 13 ? (
          <Section title="Start a side hustle">
            {hustles.map(({ def, eligible }) => (
              <ListRow key={def.id} emoji={def.emoji} title={def.name} subtitle={eligible ? def.description : `Age ${def.minAge}+`} onPress={eligible ? () => act({ type: 'startHustle', defId: def.id }) : undefined} disabled={!eligible} testID={`hustle-${def.id}`} />
            ))}
          </Section>
        ) : null}

        {game.character.age >= 14 && !game.crime.inPrison ? (
          <Section
            title="Job listings"
            right={
              canUseRewarded('reroll') ? (
                <Button title="📺 New listings" size="sm" variant="ghost" onPress={() => void rewarded('reroll')} testID="reroll-jobs" />
              ) : undefined
            }
          >
            {visibleListings.map((l) => {
              const def = JOB_BY_ID[l.defId];
              const req = def ? meetsRequirements(game, def) : { ok: false, reason: 'Unknown' };
              return (
                <ListRow
                  key={l.id}
                  emoji={def?.emoji ?? '💼'}
                  title={`${l.title}${l.partTime ? ' (part-time)' : ''}`}
                  subtitle={`${l.company}${req.ok ? '' : ` · ${req.reason}`}`}
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
                {h.title} at {h.company} · age {h.fromAge}–{h.toAge} · {h.reason}
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
