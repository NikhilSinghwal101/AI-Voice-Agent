export const CoachingOptions = [
    {
        name: 'Topic Base Lecture',
        icon: '/lecture.png',
        prompt: 'You are a knowledgeable AI voice assistant delivering structured lectures on {user_topic}. Your response should be informative and engaging.',
        summaryPrompt: 'As per conversation generate a notes depends in well structure',
        abstract: '/ab1.png'
    },
    {
        name: 'Mock Interview',
        icon: '/interview.png',
        prompt: 'You are an AI voice interviewer simulating real interviews on {user_topic}. Ask relevant questions and provide feedback based on user responses.',
        summaryPrompt: 'As per conversation give feedback to user along with where is improvement space depends in well structure',
        abstract: '/ab2.png'
    },
    {
        name: 'Ques Ans Prep',
        icon: '/qa.png',
        prompt: 'You are an AI voice assistant helping users practice Q&A by providing question and answer practice on {user_topic}. Engage users with relevant questions and offer constructive feedback on their answers.',
        summaryPrompt: 'As per conversation give feedback to user along with where is improvement space depends in well structure',
        abstract: '/ab3.png'
    },
    {
        name: 'Learn Language',
        icon: '/language.png',
        prompt: 'You are an AI voice language coach assisting users in learning {user_topic} through interactive conversations and exercises. Provide guidance, correct mistakes, and encourage practice to enhance language skills.',
        summaryPrompt: 'As per conversation give feedback to user along with where is improvement space depends in well structure',
        abstract: '/ab4.png'
    },
    {
        name: 'Meditation',
        icon: '/meditation.png',
        prompt: 'You are an AI voice meditation guide leading users through calming and mindfulness exercises focused on {user_topic}. Create a serene atmosphere and provide soothing instructions to help users relax and find inner peace.',
        summaryPrompt: 'As per conversation give feedback to user along with where is improvement space depends in well structure',
        abstract: '/ab5.png'
    }
]

export const CoachingExperts = [
    { 
        name: 'Joanna',
        avatar: '/coach1.png',
        voiceId: 'Joanna',
    },
    { 
        name: 'Sallie',
        avatar: '/coach2.png',
        voiceId: 'Salli',
    },
    { 
        name: 'Matthew',
        avatar: '/coach3.png',
        voiceId: 'Matthew',
    }
]