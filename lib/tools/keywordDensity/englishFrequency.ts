import { stem } from "@/lib/tools/keywordDensity/stem";

/**
 * Compact built-in list of ~3,000 common English words in approximate frequency-rank order
 * (general written English: news, web, books). Hand-assembled from well-known frequency
 * rankings; ranks are approximate, so anything derived from it is labelled as an estimate.
 *
 * Expected frequency follows Zipf's law: p(rank) ≈ 0.1 / rank. Words not in the list are
 * treated as rare (rank ≈ 4 × list length).
 */
const RAW = `
the be and of a in to have it i that for you he with on do say this they at but we his from not by she or as what go their can who get if
would her all my make about know will up one time there year so think when which them some me people take out into just see him your come
could now than like other how then its our two more these want way look first also new because day use no man find here thing give many
well only those tell very even back any good woman through us life child work down may after should call world over school still try last
ask need too feel three state never become between high really something most another family own leave put old while mean keep student
why let great same big group begin seem country help talk where turn problem every start hand might show part against place such again
few case week company system each right program hear question during play government run small number off always move night live point
believe hold today bring happen next without before large million must home under water room write mother area national money story young
fact month different lot study book eye job word business issue side kind four head far black long both little house yes since provide
service around friend important father sit away until power hour game often yet line political end among ever stand bad lose however member
pay law meet car city almost include continue set later community much name five once white least president learn real change team minute
best several idea kid body information nothing ago lead social understand whether watch together follow parent stop face anything create
public already speak others read level allow add office spend door health person art sure war history party within grow result open morning
walk reason low win research girl guy early food moment himself air teacher force offer enough education across although remember foot
second boy maybe toward able age policy everything love process music including consider appear actually buy probably human wait serve
market die send expect sense build stay fall oh nation plan cut college interest death course someone experience behind reach local kill
six remain effect yeah suggest class control raise care perhaps late hard field else pass former sell major sometimes require along
development themselves report role better economic effort decide rate strong possible heart drug leader light voice wife whole police mind
finally pull return free military price less according decision explain son hope develop view relationship carry town road drive arm true
federal break difference thank receive value international building action full model join season society tax director position player
agree especially record pick wear paper special space ground form support event official whose matter everyone center couple site project
hit base activity star table court oil situation cost industry figure street image itself phone either data cover quite picture clear
practice piece land recent describe product doctor wall patient worker news test movie certain north personal simply third technology catch
step baby computer type attention draw film tree source red nearly organization choose cause hair century evidence window difficult listen
soon culture billion chance brother energy period summer realize hundred available plant likely opportunity term short letter condition
choice single rule daughter administration south husband floor campaign material population economy medical hospital church close thousand
risk current fire future wrong involve defense anyone increase security bank myself certainly west sport board seek per subject officer
private rest behavior deal performance fight throw top quickly past goal bed order author fill represent focus foreign drop blood upon agency
push nature color recently store reduce sound note fine near movement page enter share common poor natural race concern series significant
similar hot language usually response dead rise animal factor decade article shoot east save seven artist scene stock career despite
central eight thus treatment beyond happy exactly protect approach lie size dog fund serious occur media ready sign thought list individual
simple quality pressure accept answer resource identify left meeting determine prepare disease whatever success argue cup particularly
amount ability staff recognize indicate character growth loss degree wonder attack herself region television box training pretty trade
election everybody physical lay general feeling standard bill message fail outside arrive analysis benefit sex forward lawyer present
section environmental glass skill sister professor operation financial crime stage ok compare authority miss design sort act ten knowledge
gun station blue strategy clearly discuss indeed truth song example democratic check environment leg dark various rather laugh guess
executive prove hang entire rock forget claim remove manager enjoy network legal religious cold final main science green memory card above
seat cell establish nice trial expert spring firm radio visit management avoid imagine tonight huge ball finish yourself theory impact
respond statement maintain charge popular traditional onto reveal direction weapon employee cultural contain peace pain apply measure wide
shake fly interview manage chair fish particular camera structure politics perform bit weight suddenly discover candidate production treat
trip evening affect inside conference unit style adult worry range mention deep edge specific writer trouble necessary throughout challenge
fear shoulder institution middle sea dream bar beautiful property instead improve stuff detail method somebody magazine hotel soldier
reflect heavy bag heat marriage tough sing surface purpose exist pattern whom skin agent owner machine gas ahead generation commercial
address cancer item reality coach yard beat violence total tend investment discussion finger garden notice collection modern task partner
positive civil kitchen consumer shot budget wish painting scientist safe agreement capital mouth nor victim newspaper threat responsibility
smile attorney score account interesting audience rich dinner vote western relate travel debate prevent citizen majority none front born
admit senior assume wind key professional mission fast alone customer suffer speech successful option participant southern fresh eventually
forest video global senate reform access restaurant judge publish relation release opinion credit critical corner concerned recall version
stare safety effective neighborhood original troop income directly hurt species immediately track basic strike sky freedom absolutely
plane nobody achieve object attitude labor refer concept client powerful perfect nine therefore conduct announce conversation examine touch
please attend completely variety sleep involved investigation nuclear researcher press conflict spirit replace british encourage argument
camp brain feature afternoon weekend dozen possibility insurance department battle beginning date generally african sorry crisis complete
fan stick define easy hole element vision status normal chinese ship solution stone slowly scale university introduce driver attempt park
spot lack ice boat drink sun distance wood handle truck mountain survey supposed tradition winter village refuse sales roll communication
screen gain resident hide gold club farm potential european presence independent district shape reader contract crowd christian express
apartment willing strength previous band obviously horse interested target prison ride guard terms demand reporter deliver text tool wild
vehicle observe flight facility understanding average emerge advantage quick leadership earn pound basis bright operate guest sample
contribute tiny block protection settle feed collect additional highly identity title mostly lesson faith river promote living count unless
marry tomorrow technique path ear shop folk principle survive lift border competition jump gather limit fit cry equipment worth associate
critic warm aspect insist failure annual french christmas comment responsible affair procedure regular spread chairman soft ignore egg
belief demonstrate anybody murder gift religion review editor engage coffee document speed cross influence anyway threaten commit female
youth wave afraid quarter background native broad wonderful deny apparently slightly reaction twice suit perspective growing blow
construction intelligence destroy cook connection burn shoe grade context committee hey mistake location clothes indian quiet dress promise
aware neighbor function bone active extend chief combine wine below cool voter learning bus dangerous remind moral united category
relatively victory academic internet healthy negative following historical medicine tour depend photo finding grab direct classroom contact
justice participate daily fair pair famous exercise knee flower tape hire familiar appropriate supply fully actor birth search tie democracy
eastern primary yesterday circle device progress bottom island exchange clean studio train lady colleague application neck lean damage
plastic tall plate hate otherwise writing male alive expression football intend chicken army abuse theater shut map extra session danger
welcome domestic lots literature rain desire assessment injury respect northern nod paint fuel leaf dry russian instruction pool climb sweet
engine fourth salt expand importance metal fat ticket software disappear corporate strange lip reading urban mental increasingly lunch
educational somewhere farmer sugar planet favorite explore obtain enemy greatest complex surround athlete invite repeat carefully soul
scientific impossible panel meaning mom married instrument predict weather presidential emotional commitment supreme bear pocket thin
temperature surprise poll proposal consequence breath sight balance adopt minority straight connect works teaching belong aid advice okay
photograph empty regional trail novel code somehow organize jury breast acknowledge theme storm union desk thanks fruit expensive yellow
conclusion prime shadow struggle conclude analyst dance regulation being ring largely shift revenue mark locate county appearance package
difficulty bridge recommend obvious basically emergency collapse transfer
online website email app click free guide tips download account user users login sign page pages blog post posts content search results
link links site sites web internet mobile video videos photo photos share comment comments review reviews price prices buy shop order
product products service services customer customers support help contact privacy policy terms cookie cookies data information
says said made used years things going got told called asked went came took gave found became left felt seemed thought knew looked
including based known given taken seen shown done written built paid sent spent held kept lost brought bought caught taught heard read
following according important really different available possible likely able major main whole entire certain various general specific
however although though whereas therefore moreover furthermore meanwhile nevertheless instead otherwise indeed rather quite fairly almost
nearly simply easily quickly slowly fully clearly directly highly mostly mainly largely especially particularly usually generally typically
recently currently finally eventually actually basically certainly definitely probably possibly perhaps maybe exactly approximately
increase decrease improve reduce boost lower raise help prevent cause affect support protect provide offer allow enable require need
benefit benefits effect effects result results study studies research evidence review analysis report data findings test tests trial trials
health healthy body weight diet food foods eat eating meal meals drink drinks water sugar fat fats protein calories vitamin minerals
heart blood brain skin bone muscle muscles risk risks disease diseases condition conditions symptoms treatment doctor patients medical
year month week day hour minute second morning evening night today tomorrow yesterday time times period date season spring summer fall
autumn winter january february march april june july august september october november december monday tuesday wednesday thursday friday
saturday sunday weekend daily weekly monthly annual annually
one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty hundred thousand million billion first second
third fourth fifth half double single multiple several many few most least more less all some any every each both either neither
small large big little huge tiny long short tall high low wide narrow deep thick thin heavy light fast slow hot cold warm cool new old
young modern ancient recent early late good bad great better best worse worst right wrong true false real fake easy hard simple complex
cheap expensive rich poor safe dangerous strong weak happy sad beautiful ugly clean dirty full empty open closed free busy ready
man men woman women child children kid kids boy boys girl girls baby babies person people family families friend friends parent parents
mother father son daughter brother sister husband wife team teams group groups member members leader leaders staff employee employees
house home room rooms door window floor wall kitchen bathroom bedroom garden building buildings office offices street road city cities town
country countries state states world area areas region place places location land village island coast north south east west
car cars bus train plane ship boat bike road traffic travel trip flight airport station hotel restaurant shop store market bank school
government minister president official officials police court law laws rule rules policy policies party election vote voters campaign
war army military soldiers attack attacks forces force troops security peace conflict fighting killed death deaths crisis
company companies business businesses industry market markets economy price prices cost costs money pay paid tax taxes job jobs worker
workers work working income sales profit growth trade investment investors fund funds bank banks financial dollar dollars pounds euros
computer computers software system systems technology tech digital network networks phone phones device devices screen data online
music song songs film films movie movies book books story stories game games sport sports player players club season match win won
art artist culture history language languages word words letter letters name names number numbers list example examples question questions
answer answers idea ideas problem problems reason reasons way ways thing things part parts kind kinds type types form forms level levels
point points line lines side sides end case cases fact facts issue issues matter matters change changes plan plans goal goals step steps
process method methods model models project projects program programs plan design size amount rate rates share percent percentage per
cent average total value values quality quantity range variety series set sets unit units piece pieces item items product products
material materials energy power oil gas fuel electricity water air fire earth sun moon star stars sky sea ocean river lake mountain tree
trees plant plants flower flowers grass animal animals dog dogs cat cats bird birds fish horse horses cow insects
eye eyes face head hair hand hands arm arms leg legs foot feet back body heart mind voice ear ears mouth nose tooth teeth finger fingers
red blue green yellow black white brown grey gray pink orange purple gold silver dark bright colour color colors colours
cook cooking bake baking recipe recipes ingredients cup cups tablespoon teaspoon minutes oven heat bowl mix add stir serve salt pepper
butter flour eggs egg milk cream cheese bread rice meat chicken beef pork fruit fruits vegetable vegetables apple apples potato potatoes
coffee tea wine beer juice chocolate cake cookies sauce oil garlic onion onions tomato tomatoes lemon sweet fresh dish dishes
learn learning teach teaching student students teacher teachers school schools class classes course courses university college education
lesson lessons skill skills knowledge training exam exams degree science scientists scientist research researchers
know knows knew think thinks believe believes feel feels want wants like likes love loves hate need needs hope hopes wish expect expects
seem seems appear appears look looks sound sounds become becomes get gets got getting give gives giving take takes taking make makes making
go goes going come comes coming see sees seeing find finds finding use uses using try tries trying ask asks asking tell tells telling
call calls calling work works keep keeps keeping let lets put puts show shows showing turn turns start starts started starting run runs
move moves moved moving live lives lived living play plays played playing hold holds bring brings happen happens happened write writes
writing read reads reading sit stand stood lose loses losing pay pays paying meet meets meeting include includes continue continues
continued set learn learns learned change changes changed changing lead leads led understand understood watch watched follow follows
followed stop stopped create creates created creating speak spoke spoken allow allows allowed add adds added adding spend spends grow
grows grew growing open opened opening walk walked win wins offer offers offered remember remembered consider considered appear appeared
buy wait waited serve served die died send expect expected build stay stayed fall fell reach reached kill remain remained suggest suggests
suggested raise raised pass passed sell sold require requires required report reported decide decided pull pulled
across along around behind below beneath beside besides beyond inside near outside past throughout toward towards underneath unlike
whose whom whatever whenever wherever whichever whoever anyone anybody anything anywhere everyone everybody everything everywhere
someone somebody something somewhere nobody nothing nowhere none
able unable sure aware afraid alone alive likely unlikely ready willing worth due similar different same certain clear obvious
important necessary possible impossible available popular common rare normal usual typical special particular personal private public
local national international global social economic political cultural natural physical mental medical legal financial human
fine nice lovely wonderful amazing excellent perfect terrible awful horrible interesting boring exciting funny serious strange
official former current recent previous future final total main major minor key basic central primary secondary extra additional
create creative creativity design designer designs build builder builds developer developers development developing app apps tool tools
feature features option options setting settings version update updates file files folder image images text table tables chart
charts code users account accounts email emails message messages chat call calls video audio camera photo social media platform
platforms brand brands marketing advertising ads campaign campaigns customer audience traffic visitors search engine engines google
article articles blog news newsletter subscribe subscription free trial plan pricing premium cost costs cheap discount deal deals offer
`;

let rankMap: Map<string, number> | null = null;
let stemRankMap: Map<string, number> | null = null;
let listSize = 0;

function build() {
  rankMap = new Map();
  stemRankMap = new Map();
  let r = 0;
  for (const w of RAW.split(/\s+/)) {
    if (!w || rankMap.has(w)) continue;
    r++;
    rankMap.set(w, r);
    const k = stem(w);
    if (!stemRankMap.has(k)) stemRankMap.set(k, r);
  }
  listSize = r;
}

/** Approximate frequency rank of a word in general English, or null if it is not in the built-in list. */
export function englishRank(word: string): number | null {
  if (!rankMap) build();
  return rankMap!.get(word) ?? stemRankMap!.get(stem(word)) ?? null;
}

/** Size of the built-in list (words). */
export function englishListSize(): number {
  if (!rankMap) build();
  return listSize;
}

/**
 * Expected share of running text taken by this word in typical English (Zipf: 0.1 / rank).
 * Unknown words are treated as rare. Numbers are expected to be rare-ish too.
 */
export function expectedRate(word: string): number {
  const r = englishRank(word);
  const rank = r ?? englishListSize() * 4;
  return 0.1 / Math.max(rank, 1);
}
