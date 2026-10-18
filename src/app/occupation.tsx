import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { WorkActionRow } from '@/components/game/WorkActionRow';
import { BadgeRow, type BadgeSpec } from '@/components/game/WorkChip';
import { DangerButton } from '@/components/game/WorkDangerButton';
import { Disclosure } from '@/components/game/WorkDisclosure';
import { earlyStage, upcomingUnlocks } from '@/components/game/workEarlyYears';
import { LevelMeter } from '@/components/game/WorkProgress';
import { jobRequirementBadges } from '@/components/game/workRequirements';
import { Sheet } from '@/components/game/WorkSheet';
import { Button, Card, confirmAction, Screen, Section, StatBar, T } from '@/components/ui';
import { HUSTLE_BY_ID } from '@/data/hustles';
import { JOB_BY_ID } from '@/data/jobs';
import { GRAD_BY_ID, MAJOR_BY_ID } from '@/data/majors';
import { dropOutBlocker, enrollOptions, hustleOptions, meetsRequirements, skipClassBlocker, STAGE_LABELS } from '@/engine';
import { scaleMoney } from '@/engine/events/text';
import { employerLabel, formatMoney, formatMoneyFull } from '@/engine/util';
import { useRewarded } from '@/hooks/useRewarded';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, workUi } from '@/theme';

/** How a past job ended, in the work history. */
const HISTORY_REASON: Record<string, string> = { quit: 'quit', fired: 'let go', promoted: 'promoted', retired: 'retired', left: 'moved on' };

const STAT_LABEL = { smarts: 'Smarts', looks: 'Looks', happiness: 'Happiness', health: 'Health' } as const;

/** Listings shown before "Show more". */
const LISTINGS_PREVIEW = 8;
const HUSTLE_MAX_LEVEL = 5;

export default function OccupationScreen() {
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const premium = useSettingsStore((s) => s.premium);
  const { notice: rewardedNotice, run: runRewarded } = useRewarded();
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [eduOpen, setEduOpen] = useState(false);
  const [hustlesOpen, setHustlesOpen] = useState(false);
  const [enrollId, setEnrollId] = useState<string | null>(null);
  if (!game) return <Redirect href="/" />;
  const cc = game.character.countryCode;
  const age = game.character.age;
  const inPrison = game.crime.inPrison;
  const job = game.career.job;
  const edu = game.education;
  const hustle = game.career.hustle;
  const options = enrollOptions(game);
  const hustles = hustleOptions(game);
  const skipBlocked = edu.enrolled ? skipClassBlocker(game) : null;
  const canDropOut = edu.enrolled && !dropOutBlocker(game);
  const early = inPrison ? null : earlyStage(game);
  const unlocks = age < 14 && !inPrison ? upcomingUnlocks(game).slice(0, 3) : [];

  // Listings the character can apply for come first; locked ones keep their order below.
  const listings = game.career.listings
    .map((l) => {
      const def = JOB_BY_ID[l.defId];
      const verdict = def ? meetsRequirements(game, def) : { ok: false, reason: 'Unknown job' };
      return { l, def, verdict, badges: def ? jobRequirementBadges(game, def, verdict) : [] };
    })
    .sort((a, b) => Number(b.verdict.ok) - Number(a.verdict.ok));
  const visibleListings = showAllJobs ? listings : listings.slice(0, LISTINGS_PREVIEW);

  const majorName = edu.major ? (MAJOR_BY_ID[edu.major]?.name ?? GRAD_BY_ID[edu.major]?.name ?? edu.major.replace(/_/g, ' ')) : null;
  const graduate = options[0]?.kind === 'graduate';
  const eligibleOptions = options.filter((o) => o.eligible).length;
  const cheapest = options.length ? Math.min(...options.map((o) => o.tuition)) : 0;
  // Programs the character can start come first.
  const sortedOptions = [...options].sort((a, b) => Number(b.eligible) - Number(a.eligible));
  const enrolling = enrollId ? options.find((o) => o.id === enrollId && o.eligible) : undefined;
  const parentsPay = game.flags.wealthyFamily === true;

  const hustleDef = hustle ? HUSTLE_BY_ID[hustle.defId] : undefined;
  const hustleEnergy = hustleDef?.energy ?? 0;
  const nextHustleIncome = hustle && hustleDef && hustle.level < HUSTLE_MAX_LEVEL ? scaleMoney(game, hustleDef.incomeByLevel[hustle.level + 1] ?? 0) : null;
  const openHustles = hustles.filter((h) => h.eligible).length;

  const subtitle = (() => {
    if (inPrison) return game.crime.juvenile ? 'Juvenile detention' : 'In prison';
    if (job) return `${job.title} · ${employerLabel(job.company)}`;
    if (edu.enrolled) return STAGE_LABELS[edu.stage];
    if (early) return early.title;
    return age < 14 ? 'Too young to work' : 'Looking for work';
  })();

  async function dropOut() {
    const college = edu.stage === 'university' || edu.stage === 'graduate';
    const what = edu.stage === 'university' ? 'university' : edu.stage === 'graduate' ? 'graduate school' : 'high school';
    const degree = majorName ? `your ${majorName} degree` : 'your degree';
    const loans = edu.studentDebt > 0 ? ` Your ${formatMoneyFull(edu.studentDebt, cc)} in student loans stays with you.` : '';
    const message = college
      ? `You'll leave without ${degree} and can't pick it back up.${loans}`
      : "You'll leave without a diploma and can't go back. Most good jobs and every university ask for one.";
    if (await confirmAction(`Drop out of ${what}?`, message, 'Drop out')) act({ type: 'dropOut' });
  }

  async function quit() {
    if (!job) return;
    if (await confirmAction('Quit your job?', `You'll leave ${job.company} and your ${formatMoneyFull(job.salary, cc)}/yr salary. Getting back in means applying from the listings again.`, 'Quit')) act({ type: 'quitJob' });
  }

  async function retire() {
    if (await confirmAction('Retire?', "You'll stop working for good and live on your pension and savings.", 'Retire')) act({ type: 'retire' });
  }

  async function stopHustle() {
    if (!hustle) return;
    if (await confirmAction(`Shut down your ${hustleDef?.noun ?? 'side hustle'}?`, `It's at level ${hustle.level} of ${HUSTLE_MAX_LEVEL}. If you start one again later, it begins from level 0.`, 'Shut it down')) act({ type: 'stopHustle' });
  }

  return (
    <Screen>
      <ScreenHeader title="Work & School" subtitle={subtitle} />
      <ScrollView contentContainerStyle={styles.content}>
        {inPrison ? (
          <Card style={styles.card} testID="prison-card">
            <T kind="subheading">{game.crime.juvenile ? '🔒 Juvenile detention' : '🔒 In prison'}</T>
            <T kind="small">
              {game.crime.sentenceYearsLeft} {game.crime.sentenceYearsLeft === 1 ? 'year' : 'years'} left
              {game.crime.juvenile ? '. School carries on inside; no work until you are released.' : ' on your sentence. No work or school until you are released.'}
            </T>
          </Card>
        ) : null}

        {!inPrison && (game.crime.paroleYearsLeft ?? 0) > 0 ? (
          <Card style={styles.card} testID="parole-card">
            <T kind="subheading">🪪 On parole</T>
            <T kind="small">
              {game.crime.paroleYearsLeft} {game.crime.paroleYearsLeft === 1 ? 'year' : 'years'} left. Another conviction would count double.
            </T>
          </Card>
        ) : null}

        {early ? (
          <Section title="Right now">
            <Card style={[styles.card, styles.earlyCard]} testID="early-years">
              <Text style={styles.earlyEmoji}>{early.emoji}</Text>
              <T kind="heading">{early.title}</T>
              <T kind="small" style={styles.center}>
                {early.body}
              </T>
            </Card>
          </Section>
        ) : null}

        {edu.enrolled ? (
          <Section title="School">
            <Card style={styles.card}>
              <T kind="subheading">
                🏫 {STAGE_LABELS[edu.stage]}
                {majorName ? ` · ${majorName}` : ''}
              </T>
              <LabeledBar label="Grade" value={edu.grade} color={colors.smarts} />
              {edu.studentDebt > 0 ? <T kind="small">Student loans: {formatMoneyFull(edu.studentDebt, cc)}</T> : null}
              {edu.scholarship ? <T kind="small">🎓 Scholarship: tuition covered.</T> : null}
              <View style={styles.row}>
                <Button title="Study harder" size="sm" onPress={() => act({ type: 'study' })} disabled={edu.studiedThisYear} style={[styles.flex, styles.tap]} testID="study" />
                <Button title="Skip class" size="sm" variant="secondary" onPress={() => act({ type: 'skipClass' })} disabled={!!skipBlocked} style={[styles.flex, styles.tap]} testID="skip-class" />
              </View>
              {skipBlocked ? <T kind="small">{skipBlocked}</T> : null}
              {canDropOut ? (
                <>
                  <View style={styles.divider} />
                  <DangerButton title="Drop out" onPress={() => void dropOut()} testID="drop-out" />
                </>
              ) : null}
            </Card>
          </Section>
        ) : null}

        {job ? (
          <Section title="Current job">
            <Card style={styles.card}>
              <T kind="subheading">
                {JOB_BY_ID[job.defId]?.emoji ?? '💼'} {job.title}
              </T>
              <T kind="small">
                {employerLabel(job.company)} · {job.yearsHeld} {job.yearsHeld === 1 ? 'year' : 'years'}
                {job.partTime ? ' · part-time' : ''}
              </T>
              <Text style={styles.salary}>
                {formatMoneyFull(job.salary, cc)}
                <Text style={styles.salaryUnit}>/yr</Text>
              </Text>
              <LabeledBar label="Performance" value={job.performance} color={colors.accent} />
              <View style={styles.row}>
                <Button title="Work harder" size="sm" onPress={() => act({ type: 'workHarder' })} disabled={job.workedHarderThisYear} style={[styles.flex, styles.tap]} testID="work-harder" />
                <Button title="Ask for a raise" size="sm" variant="secondary" onPress={() => act({ type: 'askRaise' })} disabled={job.askedThisYear} style={[styles.flex, styles.tap]} testID="ask-raise" />
              </View>
              <Button title="Ask for a promotion" size="sm" variant="secondary" onPress={() => act({ type: 'askPromotion' })} disabled={job.askedThisYear} style={styles.tap} testID="ask-promotion" />
              {job.askedThisYear ? <T kind="small">You&apos;ve already asked your boss for something this year.</T> : null}
              <View style={styles.divider} />
              {age >= 60 ? (
                <Button title="Retire" size="sm" variant="secondary" onPress={() => void retire()} style={styles.tap} testID="retire" />
              ) : (
                <DangerButton title="Quit" onPress={() => void quit()} testID="quit-job" />
              )}
            </Card>
          </Section>
        ) : null}

        {hustle ? (
          <Section title="Side hustle">
            <Card style={styles.card}>
              <T kind="subheading">
                {hustleDef?.emoji ?? '💡'} {hustle.name}
              </T>
              <LevelMeter
                level={hustle.level}
                max={HUSTLE_MAX_LEVEL}
                color={colors.accent}
                label={`Level ${hustle.level} of ${HUSTLE_MAX_LEVEL}`}
                note={nextHustleIncome !== null ? `Next level: ~${formatMoney(nextHustleIncome, cc)}/yr` : 'Maxed out'}
                testID="hustle-level"
              />
              <T kind="small">Last year: {formatMoneyFull(hustle.lastIncome, cc)}</T>
              <BadgeRow
                badges={[
                  ...(hustleEnergy ? [{ label: `⚡ ${hustleEnergy} energy a year`, tone: 'energy' } as BadgeSpec] : []),
                  ...(hustleDef ? [{ label: `Grows with ${STAT_LABEL[hustleDef.stat]} (yours: ${game.character.stats[hustleDef.stat]})`, tone: 'info' } as BadgeSpec] : []),
                ]}
              />
              <View style={styles.divider} />
              <DangerButton title="Shut it down" onPress={() => void stopHustle()} testID="stop-hustle" />
            </Card>
          </Section>
        ) : null}

        {age >= 14 && !inPrison ? (
          <Section
            title="Job listings"
            right={
              canUseRewarded('reroll') ? (
                <Button title={premium ? '✨ New listings' : '📺 New listings'} size="sm" variant="ghost" onPress={() => void runRewarded('reroll')} style={styles.tap} testID="reroll-jobs" />
              ) : undefined
            }
          >
            {rewardedNotice ? (
              <T kind="small" testID="rewarded-notice">
                {rewardedNotice}
              </T>
            ) : null}
            {visibleListings.map(({ l, def, verdict, badges }) => (
              <WorkActionRow
                key={l.id}
                emoji={def?.emoji ?? '💼'}
                title={l.title}
                subtitle={employerLabel(l.company)}
                badges={badges}
                value={formatMoney(l.salary, cc)}
                valueSuffix="/yr"
                onPress={() => act({ type: 'applyJob', listingId: l.id })}
                disabled={!verdict.ok}
                accessibilityHint="Applies for this job"
                testID={`apply-${l.defId}`}
              />
            ))}
            {listings.length > LISTINGS_PREVIEW && !showAllJobs ? (
              <Button title={`Show ${listings.length - LISTINGS_PREVIEW} more`} variant="ghost" size="sm" onPress={() => setShowAllJobs(true)} style={styles.tap} testID="more-listings" />
            ) : null}
            {listings.length === 0 ? <T kind="small">No listings yet. Age up to see this year&apos;s jobs.</T> : null}
          </Section>
        ) : null}

        {!hustle && age >= 13 && !inPrison ? (
          <Section title="Side hustles">
            <Disclosure
              title="Start a side hustle"
              emoji="💡"
              summary={`${hustles.length} ideas · ${openHustles ? `${openHustles} open to you` : 'none open yet'}`}
              open={hustlesOpen}
              onToggle={() => setHustlesOpen((o) => !o)}
              testID="hustle-options"
            >
              {hustles.map(({ def, eligible, reason }) => (
                <WorkActionRow
                  key={def.id}
                  emoji={def.emoji}
                  title={def.name}
                  subtitle={eligible ? def.description : reason}
                  badges={[
                    { label: `⚡ ${def.energy} a year`, tone: 'energy' },
                    { label: `Grows with ${STAT_LABEL[def.stat]}`, tone: 'neutral' },
                  ]}
                  value={formatMoney(scaleMoney(game, def.incomeByLevel[HUSTLE_MAX_LEVEL] ?? 0), cc)}
                  valueSuffix="/yr"
                  valueCaption="at level 5"
                  onPress={() => act({ type: 'startHustle', defId: def.id })}
                  disabled={!eligible}
                  accessibilityHint="Starts this side hustle"
                  testID={`hustle-${def.id}`}
                />
              ))}
            </Disclosure>
          </Section>
        ) : null}

        {!edu.enrolled && options.length ? (
          <Section title="Education">
            <Disclosure
              title={graduate ? 'Graduate school' : 'Go to university'}
              emoji="🎓"
              summary={`${options.length} ${graduate ? 'programs' : 'majors'} · ${eligibleOptions} open to you · from ${formatMoney(cheapest, cc)}/yr`}
              open={eduOpen}
              onToggle={() => setEduOpen((o) => !o)}
              testID="edu-options"
            >
              {sortedOptions.map((o) => {
                const minSmarts = MAJOR_BY_ID[o.id]?.minSmarts ?? GRAD_BY_ID[o.id]?.minSmarts;
                const badges: BadgeSpec[] = [{ label: `${o.years} years`, tone: 'neutral' }];
                if (minSmarts !== undefined) badges.push({ label: `🧠 ${minSmarts}+ Smarts`, tone: game.character.stats.smarts >= minSmarts ? 'good' : 'bad' });
                if (o.reason && !/Smarts/.test(o.reason)) badges.push({ label: o.reason, tone: 'bad' });
                return (
                  <WorkActionRow
                    key={o.id}
                    emoji="🎓"
                    title={o.name}
                    badges={badges}
                    value={formatMoney(o.tuition, cc)}
                    valueSuffix="/yr"
                    onPress={() => setEnrollId(o.id)}
                    disabled={!o.eligible}
                    accessibilityHint="Shows the cost before you enroll"
                    testID={`enroll-${o.id}`}
                  />
                );
              })}
            </Disclosure>
          </Section>
        ) : null}

        {unlocks.length ? (
          <Section title="Coming up">
            <Card style={styles.card} testID="coming-up">
              {unlocks.map((u) => (
                <View key={u.label} style={styles.unlock}>
                  <Text style={styles.unlockEmoji}>{u.emoji}</Text>
                  <T kind="body" style={styles.flex}>
                    {u.label} at {u.age}
                  </T>
                  <T kind="small">{u.inYears === 1 ? 'next year' : `in ${u.inYears} years`}</T>
                </View>
              ))}
            </Card>
          </Section>
        ) : null}

        {game.career.history.length ? (
          <Section title="Work history">
            {game.career.history
              .slice(-5)
              .reverse()
              .map((h, i) => (
                <Text key={i} style={styles.history}>
                  {h.title} · {employerLabel(h.company)} · age {h.fromAge}–{h.toAge} · {HISTORY_REASON[h.reason] ?? h.reason}
                </Text>
              ))}
          </Section>
        ) : null}
      </ScrollView>

      <Sheet
        visible={!!enrolling}
        onClose={() => setEnrollId(null)}
        emoji="🎓"
        title={enrolling?.name ?? ''}
        subtitle={enrolling?.kind === 'graduate' ? 'Graduate program' : "Bachelor's degree"}
        rows={
          enrolling
            ? [
                { label: 'Length', value: `${enrolling.years} years` },
                { label: 'Tuition', value: `${formatMoneyFull(enrolling.tuition, cc)}/yr` },
                { label: 'Total tuition', value: formatMoneyFull(enrolling.tuition * enrolling.years, cc), strong: true },
                { label: 'Paid by', value: parentsPay ? 'Your parents' : 'Student loans', color: parentsPay ? workUi.gain : colors.warning },
                ...(edu.studentDebt > 0 ? [{ label: 'Loans you already have', value: formatMoneyFull(edu.studentDebt, cc) }] : []),
              ]
            : []
        }
        note={
          parentsPay
            ? 'Your family is covering tuition, so you will finish without student loans.'
            : 'Each year of tuition goes on your student loans unless you win a scholarship (top grades and high Smarts help). You pay the loans back out of your income later.'
        }
        actions={[
          {
            title: 'Enroll',
            testID: 'enroll-confirm',
            onPress: () => {
              if (enrolling) act({ type: 'enroll', major: enrolling.id });
              setEnrollId(null);
              setEduOpen(false);
            },
          },
        ]}
        testID="enroll-sheet"
      />
    </Screen>
  );
}

/** A stat bar with its label above it, so long labels ("Performance") never wrap mid-word. */
function LabeledBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.barWrap}>
      <T kind="label">{label.toUpperCase()}</T>
      <StatBar label={label} value={value} color={color} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  barWrap: { gap: spacing.xs },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  tap: { minHeight: workUi.touch },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.cardBorder, marginVertical: spacing.xs },
  salary: { color: colors.money, fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  salaryUnit: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  earlyCard: { alignItems: 'center', paddingVertical: spacing.xl },
  earlyEmoji: { fontSize: 44 },
  center: { textAlign: 'center' },
  unlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 32 },
  unlockEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  history: { color: colors.textMuted, fontSize: 13, paddingHorizontal: spacing.xs },
});
