import { expect, test } from '@playwright/test'

const enterTimes = async (
  page: import('@playwright/test').Page,
  input: string,
) => {
  const textarea = page.getByPlaceholder(/Enter your times here/)
  await textarea.fill(input)
  await textarea.blur()
}

test.describe('time calculator', () => {
  test('sums a working day entered into the textarea', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('Time Calculator')

    await enterTimes(page, '09.00 - 12.30\n13.00 - 17.00')

    await expect(page.getByText('09.00 - 12.30')).toBeVisible()
    await expect(page.getByText('13.00 - 17.00')).toBeVisible()
    await expect(page.getByText('7 Hours 30 Minutes')).toBeVisible()
  })

  test('toggles pauses and keeps the choice across a reload', async ({
    page,
  }) => {
    await page.goto('/')
    await enterTimes(page, '09.00 - 12.00\n13.00 - 17.00')

    await expect(page.getByText(/Pause in between/)).toBeHidden()

    await page.getByLabel('Show Pauses:').check()
    await expect(page.getByText(/Pause in between/)).toBeVisible()
    await expect(page.getByText('{ 1 Hours 0 Minutes }')).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Show Pauses:')).toBeChecked()
  })

  test('counts a night shift as positive time', async ({ page }) => {
    await page.goto('/')
    await enterTimes(page, '22.00 - 02.00')

    await expect(page.getByText('4 Hours 0 Minutes')).toBeVisible()
  })

  test('reports unparsable input instead of failing silently', async ({
    page,
  }) => {
    await page.goto('/')
    await enterTimes(page, 'definitely not a time')

    await expect(
      page.getByText('Could not parse this input: "definitely not a time"'),
    ).toBeVisible()
    await expect(page.getByText('0 Hours 0 Minutes')).toBeVisible()
  })

  test('counts a shift that resumes after midnight', async ({ page }) => {
    await page.goto('/')
    await enterTimes(page, '20.00 - 23.00\n01.00 - 04.00')

    await expect(page.getByText('6 Hours 0 Minutes')).toBeVisible()
    await expect(
      page.getByText(/starts before the previous entry/),
    ).toBeHidden()
  })

  test('flags entries that run backwards', async ({ page }) => {
    await page.goto('/')
    await enterTimes(page, '09.00 - 12.00\n08.00 - 10.00')

    await expect(
      page.getByText('08.00 starts before the previous entry ended at 12.00'),
    ).toBeVisible()
  })

  test('switches away from the browser-detected language on the first click', async ({
    page,
  }) => {
    // The browser locale is pinned to de-DE, so the page starts in German and
    // the first click is the case that used to do nothing at all.
    await page.goto('/')

    await page.getByRole('link', { name: 'Datenschutzerklärung' }).click()
    await expect(page).toHaveURL(/\/privacy$/)

    await page.getByRole('button', { name: 'English' }).click()
    await expect(page.getByRole('link', { name: 'Imprint' })).toBeVisible()

    await page.getByRole('button', { name: 'Deutsch' }).click()
    await expect(page.getByRole('link', { name: 'Impressum' })).toBeVisible()
  })
})
