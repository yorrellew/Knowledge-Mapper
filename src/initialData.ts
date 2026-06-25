/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EducationalNode, NodeRelation } from './types';

export const INITIAL_NODES: EducationalNode[] = [
  {
    id: 'jean-piaget',
    type: 'person',
    name: 'Jean Piaget',
    description: 'Swiss psychologist known for his pioneered systematic work on child development and cognitive theory.',
    details: 'Piaget was a pioneer in developmental psychology. He proposed that children are active builders of knowledge—often called "little scientists"—who construct their understanding of the world through interaction. He identified four key stages of developmental process which emphasize cognitive restructuring.',
    chronology: '1896 - 1980',
    chronologyVal: 1896,
    tags: ['Developmental', 'Cognitive', 'Swiss'],
    nationality: 'Swiss',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Jean_Piaget_in_Ann_Arbor.png',
    x: 420,
    y: 130,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lev-vygotsky',
    type: 'person',
    name: 'Lev Vygotsky',
    description: 'Soviet psychologist who developed the powerhouse Social Development Theory of cognitive learning.',
    details: 'Vygotsky pioneered the Social Constructivist theory. Unlike Piaget, who focused on individual exploration, Vygotsky argued that community, communication, and social interaction play a fundamental role in the development of cognition.',
    chronology: '1896 - 1934',
    chronologyVal: 1896,
    tags: ['Developmental', 'Socio-cultural', 'Soviet'],
    nationality: 'Soviet',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7e/Lev_Vygotsky.jpg',
    x: 180,
    y: 130,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bf-skinner',
    type: 'person',
    name: 'B.F. Skinner',
    description: 'American psychologist, behaviorist, author, and social philosopher.',
    details: 'Skinner developed the theory of Operant Conditioning. He believed that human action was best understood as responses to environmental consequences, introducing terms like positive reinforcement and operant conditioning chambers.',
    chronology: '1904 - 1990',
    chronologyVal: 1904,
    tags: ['Behaviorism', 'Reinforcement', 'American'],
    nationality: 'American',
    x: 750,
    y: 130,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'albert-bandura',
    type: 'person',
    name: 'Albert Bandura',
    description: 'Psychologist famous for his Bobo doll experiment showing Social Learning Theory.',
    details: 'Bandura bridged the gap between Behaviorism and Cognitive theories. He introduced the concepts of observational learning, modeling, and self-efficacy, highlighting how people can acquire new behaviors without direct reinforcement.',
    chronology: '1925 - 2021',
    chronologyVal: 1925,
    tags: ['Cognitive', 'Social', 'Modeling'],
    nationality: 'Canadian-American',
    x: 600,
    y: 420,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'jerome-bruner',
    type: 'person',
    name: 'Jerome Bruner',
    description: 'American cognitive psychologist who made key contributions to cognitive learning and instruction theory.',
    details: 'Bruner developed the Spiral Curriculum and pioneered Discovery Learning. He took Piagetian ideas of developmental readiness and reframed them to show how any subject can be taught effectively in an intellectually honest way to any child at any stage of development.',
    chronology: '1915 - 2016',
    chronologyVal: 1915,
    tags: ['Cognitive', 'Curriculum', 'Pedagogy'],
    nationality: 'American',
    x: 300,
    y: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Theories
  {
    id: 'cognitive-development',
    type: 'theory',
    name: 'Cognitive Development Theory',
    description: 'Comprehensive theory about the nature and progression of human intelligence.',
    details: 'Piaget\'s theory asserts that cognitive growth happens through structural adjustment: assimilation (fitting new ideas into existing schemas) and accommodation (changing existing schemas to accommodate new observations). It posits four concrete developmental stages: Sensori-motor, Pre-operational, Concrete operational, and Formal operational.',
    chronology: '1936',
    chronologyVal: 1936,
    tags: ['Development', 'Stages', 'Schemas'],
    x: 420,
    y: 280,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'social-constructivism',
    type: 'theory',
    name: 'Social Constructivism',
    description: 'Learning theory emphasizing collaborative dialogue and socio-cultural interactions.',
    details: 'First fully articulated by Vygotsky, Social Constructivism highlights that knowledge is created and constructed collectively through active interactions with the social space, culture, and context-dependent experiences.',
    chronology: '1934',
    chronologyVal: 1934,
    tags: ['Socio-cultural', 'Dialogue', 'Culture'],
    x: 180,
    y: 280,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'behaviorism',
    type: 'theory',
    name: 'Behaviorism',
    description: 'A theoretical framework stating that all behaviors are acquired through conditioning.',
    details: 'Behaviorism focuses solely on observable actions rather than unobservable internal states or mechanisms. It explains behavior as an direct product of stimulus-response pairings and immediate feedback loops.',
    chronology: '1913',
    chronologyVal: 1913,
    tags: ['Conditioning', 'Stimulus', 'Observable'],
    x: 750,
    y: 280,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Concepts
  {
    id: 'zpd',
    type: 'concept',
    name: 'Zone of Proximal Development',
    description: 'The sweet spot of learning between what a student can do unsupported and what they cannot do at all.',
    details: 'Vygotsky defined ZPD as the difference between a learner\'s actual independent developmental capacity and the potential maximum development capacity guided by skilled mentors or peer collaboration.',
    chronology: '1930',
    chronologyVal: 1930,
    tags: ['Collaboration', 'Mentorship', 'Sweet-spot'],
    x: 100,
    y: 450,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'scaffolding',
    type: 'concept',
    name: 'Instructional Scaffolding',
    description: 'Temporary supportive structures provided to a student during the learning process.',
    details: 'Pioneered by Wood, Bruner, and Ross (though often conceptually paired with Vygotsky\'s ZPD), scaffolding refers to high-quality, temporary support structures that are gradually removed as learners build autonomy and native mastery.',
    chronology: '1976',
    chronologyVal: 1976,
    tags: ['Instruction', 'Support', 'Fading'],
    x: 200,
    y: 600,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'operant-conditioning',
    type: 'concept',
    name: 'Operant Conditioning',
    description: 'Learning behavior governed by reinforcements and punishments.',
    details: 'A conceptual model created by B.F. Skinner where behavior is strengthened or weakened based on its direct consequences. Involves key positive and negative modifiers: reinforcements reward and encourage behavior, while punishments deter it.',
    chronology: '1938',
    chronologyVal: 1938,
    tags: ['Reinforcement', 'Reward', 'Consequence'],
    x: 850,
    y: 450,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'schema',
    type: 'concept',
    name: 'Cognitive Schema',
    description: 'Mental constructs used to categorize and interpret informational structures.',
    details: 'A cohesive cognitive framework or blueprint of concept associations created by Jean Piaget. Schemas serve as cognitive mental filing systems that streamline incoming experiences and help organize information processing.',
    chronology: '1923',
    chronologyVal: 1923,
    tags: ['Cognition', 'Filing-system', 'Structures'],
    x: 480,
    y: 450,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Texts
  {
    id: 'thought-and-language',
    type: 'text',
    name: 'Thought and Language',
    description: 'Vygotsky\'s foundational text on the relationship between language development and conceptual thought.',
    details: 'Published posthumously in 1934, this book articulates Vygotsky\'s view that thought and speech have different roots but merge in development. It outlines how inner speech develops and critiques Piaget\'s concept of egocentric speech.',
    chronology: '1934',
    chronologyVal: 1934,
    tags: ['Book', 'Vygotsky', 'Linguistics'],
    author: 'Lev Vygotsky',
    abstract: 'An exploration of the genetic roots of thought and speech, proposing that word meaning develops and evolves rather than being static.',
    originalLanguage: 'Russian',
    pdfUrl: 'https://monoskop.org/images/8/87/Vygotsky_Lev_Thought_and_Language.pdf',
    altTitles: 'Thinking and Speech (Myshlenie i rech)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Lev_Vygotsky_Thought_and_Language.png/320px-Lev_Vygotsky_Thought_and_Language.png',
    x: 80,
    y: 280,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'origins-of-intelligence',
    type: 'text',
    name: 'The Origins of Intelligence in Children',
    description: 'Piaget\'s detailed observation of his own children forming the basis of his sensorimotor stage theory.',
    details: 'A key text where Piaget outlines the six sub-stages of sensorimotor development, tracing intelligence from basic reflexes to mental representation.',
    chronology: '1936',
    chronologyVal: 1936,
    tags: ['Book', 'Piaget', 'Observation'],
    author: 'Jean Piaget',
    abstract: 'Detailed case studies of cognitive beginnings in infants, demonstrating intelligence as adaptation to the environment.',
    originalLanguage: 'French',
    altTitles: 'La naissance de l\'intelligence chez l\'Enfant',
    x: 550,
    y: 260,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_RELATIONS: NodeRelation[] = [
  {
    id: 'rel1',
    sourceId: 'jean-piaget',
    targetId: 'cognitive-development',
    label: 'formulated',
    description: 'Piaget formulated his Cognitive Development Theory to explain intellectual milestones in children.'
  },
  {
    id: 'rel2',
    sourceId: 'lev-vygotsky',
    targetId: 'social-constructivism',
    label: 'formulated',
    description: 'Vygotsky laid the groundwork for Social Constructivism in cultural psychology.'
  },
  {
    id: 'rel3',
    sourceId: 'bf-skinner',
    targetId: 'behaviorism',
    label: 'developed',
    description: 'Skinner expanded classical behaviorism into operant learning paradigms.'
  },
  {
    id: 'rel4',
    sourceId: 'social-constructivism',
    targetId: 'zpd',
    label: 'contains',
    description: 'The Zone of Proximal Development is the core practical mechanism of social constructivism.'
  },
  {
    id: 'rel5',
    sourceId: 'zpd',
    targetId: 'scaffolding',
    label: 'inspired',
    description: 'Scaffolding structures are designed specifically to operate within a student\'s ZPD.'
  },
  {
    id: 'rel6',
    sourceId: 'jerome-bruner',
    targetId: 'scaffolding',
    label: 'co-formulated',
    description: 'Bruner co-formulated and popularised the conceptual term Scaffolding.'
  },
  {
    id: 'rel7',
    sourceId: 'jean-piaget',
    targetId: 'schema',
    label: 'defined',
    description: 'Piaget introduced schemas as the building blocks of structural learning.'
  },
  {
    id: 'rel8',
    sourceId: 'cognitive-development',
    targetId: 'schema',
    label: 'relies on',
    description: 'Growth through assimilation and accommodation relies on restructuring schema fields.'
  },
  {
    id: 'rel9',
    sourceId: 'bf-skinner',
    targetId: 'operant-conditioning',
    label: 'defined',
    description: 'Skinner formally defined operant conditioning utilizing positive and negative reinforced behaviors.'
  },
  {
    id: 'rel10',
    sourceId: 'albert-bandura',
    targetId: 'behaviorism',
    label: 'critiqued',
    description: 'Bandura critiqued behaviorism for neglecting pure sensory observation and cognitive processes.'
  },
  {
    id: 'rel11',
    sourceId: 'albert-bandura',
    targetId: 'cognitive-development',
    label: 'influenced by',
    description: 'Bandura integrated cognitive elements into behavioral models, influenced by Piagetian structures.'
  },
  {
    id: 'rel12',
    sourceId: 'lev-vygotsky',
    targetId: 'thought-and-language',
    label: 'authored',
    description: 'Vygotsky collected his psychological observations on speech into this seminal text prior to his death.'
  },
  {
    id: 'rel13',
    sourceId: 'thought-and-language',
    targetId: 'social-constructivism',
    label: 'establishes',
    description: 'The text lays the conceptual foundation for social interactions mediating cognitive structures.'
  },
  {
    id: 'rel14',
    sourceId: 'jean-piaget',
    targetId: 'origins-of-intelligence',
    label: 'authored',
    description: 'Piaget systematically documented the development of his three children.'
  },
  {
    id: 'rel15',
    sourceId: 'origins-of-intelligence',
    targetId: 'cognitive-development',
    label: 'outlines',
    description: 'The book defines the first (sensorimotor) stage of his overarching cognitive development theory.'
  }
];
