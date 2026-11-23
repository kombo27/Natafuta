import type { CategoryId, Localized } from '../types';

export interface Category {
  id: CategoryId;
  emoji: string;
  tint: string;
  name: Localized;
  subs: { id: string; name: Localized }[];
}

const s = (id: string, en: string, sw: string) => ({ id, name: { en, sw } });

export const CATEGORIES: Category[] = [
  { id: 'electronics', emoji: '📱', tint: '#CDE8DD', name: { en: 'Electronics', sw: 'Elektroniki' }, subs: [
    s('phones', 'Mobile phones', 'Simu'), s('laptops', 'Laptops & computers', 'Kompyuta'),
    s('tv', 'TV & audio', 'TV na redio'), s('accessories', 'Accessories', 'Vifaa'),
    s('gaming', 'Gaming & cameras', 'Michezo na kamera')] },
  { id: 'vehicles', emoji: '🏍️', tint: '#DCE3F5', name: { en: 'Vehicles', sw: 'Magari' }, subs: [
    s('cars', 'Cars', 'Magari'), s('motorbikes', 'Motorbikes & bajaji', 'Pikipiki na bajaji'),
    s('trucks', 'Trucks & buses', 'Malori na mabasi'), s('parts', 'Spare parts', 'Vipuri'),
    s('bicycles', 'Bicycles', 'Baiskeli')] },
  { id: 'agriculture', emoji: '🐄', tint: '#F1E3BC', name: { en: 'Agriculture & livestock', sw: 'Kilimo na mifugo' }, subs: [
    s('livestock', 'Livestock', 'Mifugo'), s('poultry', 'Poultry', 'Kuku na ndege'),
    s('seeds', 'Seeds & fertiliser', 'Mbegu na mbolea'), s('machinery', 'Farm machinery', 'Mashine za kilimo'),
    s('produce', 'Produce', 'Mazao')] },
  { id: 'property', emoji: '🏠', tint: '#F5DCD3', name: { en: 'Property', sw: 'Nyumba na viwanja' }, subs: [
    s('rent', 'For rent', 'Kupangisha'), s('sale', 'For sale', 'Kuuza'), s('land', 'Land & plots', 'Viwanja'),
    s('commercial', 'Shops & offices', 'Maduka na ofisi'), s('short', 'Short stay', 'Muda mfupi')] },
  { id: 'jobs', emoji: '💼', tint: '#E6DDF2', name: { en: 'Jobs', sw: 'Kazi' }, subs: [
    s('fulltime', 'Full-time', 'Kudumu'), s('parttime', 'Part-time', 'Muda mfupi'), s('casual', 'Casual work', 'Vibarua')] },
  { id: 'services', emoji: '🛠️', tint: '#D9E7EF', name: { en: 'Services', sw: 'Huduma' }, subs: [
    s('repairs', 'Repairs', 'Matengenezo'), s('beauty', 'Beauty', 'Urembo'), s('transport', 'Transport', 'Usafiri'),
    s('cleaning', 'Cleaning', 'Usafi'), s('lessons', 'Lessons', 'Masomo')] },
  { id: 'fashion', emoji: '👗', tint: '#DDE6FA', name: { en: 'Fashion', sw: 'Mavazi' }, subs: [
    s('women', 'Women', 'Wanawake'), s('men', 'Men', 'Wanaume'), s('shoes', 'Shoes', 'Viatu'),
    s('bags', 'Bags & jewellery', 'Mikoba na vito')] },
  { id: 'home', emoji: '🛋️', tint: '#E8DFD3', name: { en: 'Home & garden', sw: 'Nyumbani na bustani' }, subs: [
    s('furniture', 'Furniture', 'Samani'), s('kitchen', 'Kitchen', 'Jikoni'),
    s('appliances', 'Appliances', 'Vifaa vya nyumbani'), s('garden', 'Garden', 'Bustani')] },
  { id: 'kids', emoji: '🧸', tint: '#E9DCF0', name: { en: 'Kids & baby', sw: 'Watoto' }, subs: [
    s('clothes', 'Clothes', 'Nguo'), s('toys', 'Toys', 'Vitu vya kuchezea'), s('strollers', 'Strollers & seats', 'Vigari na viti')] },
  { id: 'sports', emoji: '⚽', tint: '#D6EBDD', name: { en: 'Sports, music & books', sw: 'Michezo, muziki na vitabu' }, subs: [
    s('sports', 'Sports', 'Michezo'), s('music', 'Musical instruments', 'Ala za muziki'), s('books', 'Books', 'Vitabu')] },
  { id: 'pets', emoji: '🐕', tint: '#F3E6CF', name: { en: 'Pets', sw: 'Wanyama vipenzi' }, subs: [
    s('dogs', 'Dogs', 'Mbwa'), s('cats', 'Cats', 'Paka'), s('birds', 'Birds', 'Ndege'), s('petgear', 'Accessories', 'Vifaa')] },
  { id: 'free', emoji: '🎁', tint: '#F6D9CF', name: { en: 'Bure (free)', sw: 'Bure' }, subs: [] },
];

export const CAT: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, Category>;

/** Ninatafuta Pay is offered for goods with a price – not for jobs, services or property. */
export const PAY_EXCLUDED: CategoryId[] = ['jobs', 'services', 'property', 'free'];
