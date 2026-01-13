// Shared sample data for demo purposes across all pages

export interface SamplePhotographer {
  id: string;
  user_id: string;
  specialties: string[];
  gear: string[];
  portfolio_images: string[];
  is_approved: boolean;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    bio: string;
    avatar_url: string;
    location: string;
    phone?: string;
  };
  services_count: number;
}

export interface SampleService {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_hours: number;
  photographer_id: string;
  is_active?: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    location: string;
  };
  photographer_profiles?: {
    specialties: string[];
  };
}

export interface SampleReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  is_public: boolean;
  reviewer_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

export const samplePhotographers: SamplePhotographer[] = [
  {
    id: "sample-1",
    user_id: "sample-user-1",
    specialties: ["Wedding", "Portrait", "Engagement"],
    gear: ["Canon EOS R5", "Sony A7 IV", "85mm f/1.4", "24-70mm f/2.8"],
    portfolio_images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
      "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800"
    ],
    is_approved: true,
    profiles: {
      id: "sample-user-1",
      first_name: "John",
      last_name: "Doe",
      bio: "Award-winning wedding and portrait photographer with 10+ years of experience capturing life's most precious moments. I believe in creating timeless images that tell your unique story.",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      location: "New York, NY",
      phone: "+1 (555) 123-4567"
    },
    services_count: 5
  },
  {
    id: "sample-2",
    user_id: "sample-user-2",
    specialties: ["Event", "Corporate", "Concert"],
    gear: ["Nikon Z9", "Phase One", "Profoto Lighting"],
    portfolio_images: [
      "https://images.unsplash.com/photo-1540575467063-178a50e2fd87?w=800",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800",
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
    ],
    is_approved: true,
    profiles: {
      id: "sample-user-2",
      first_name: "Sarah",
      last_name: "Smith",
      bio: "Event and corporate photographer specializing in professional documentation for businesses, conferences, and live events. Creating images that capture the energy of your event.",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      location: "Los Angeles, CA",
      phone: "+1 (555) 234-5678"
    },
    services_count: 8
  },
  {
    id: "sample-3",
    user_id: "sample-user-3",
    specialties: ["Nature", "Adventure", "Engagement"],
    gear: ["Sony A1", "DJI Mavic 3", "16-35mm f/2.8"],
    portfolio_images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800"
    ],
    is_approved: true,
    profiles: {
      id: "sample-user-3",
      first_name: "Mike",
      last_name: "Johnson",
      bio: "Nature and adventure photographer documenting Earth's most beautiful places. Available for travel assignments, adventure engagement sessions, and outdoor photography worldwide.",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      location: "Denver, CO",
      phone: "+1 (555) 345-6789"
    },
    services_count: 3
  },
  {
    id: "sample-4",
    user_id: "sample-user-4",
    specialties: ["Fashion", "Commercial", "Beauty"],
    gear: ["Canon R6 II", "85mm f/1.2", "Profoto B10"],
    portfolio_images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800"
    ],
    is_approved: true,
    profiles: {
      id: "sample-user-4",
      first_name: "Emma",
      last_name: "Wilson",
      bio: "Professional fashion and commercial photographer working with top brands and models worldwide. Creating stunning images for campaigns, lookbooks, and editorials.",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      location: "Miami, FL",
      phone: "+1 (555) 456-7890"
    },
    services_count: 6
  },
  {
    id: "sample-5",
    user_id: "sample-user-5",
    specialties: ["Documentary", "Street", "Family"],
    gear: ["Sony A7R V", "35mm f/1.4", "50mm f/1.2"],
    portfolio_images: [
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800",
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800",
      "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800",
      "https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=800"
    ],
    is_approved: true,
    profiles: {
      id: "sample-user-5",
      first_name: "David",
      last_name: "Brown",
      bio: "Documentary and street photographer capturing authentic family moments and urban stories. Natural, candid photography that tells your story.",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      location: "Chicago, IL",
      phone: "+1 (555) 567-8901"
    },
    services_count: 4
  }
];

export const sampleServices: SampleService[] = [
  {
    id: "sample-service-1",
    title: "Wedding Photography Package",
    description: "Complete wedding day coverage including ceremony, reception, and getting ready shots. Includes 500+ edited photos.",
    price: 2500,
    duration_hours: 8,
    is_active: true,
    photographer_id: "sample-user-1",
    profiles: {
      first_name: "John",
      last_name: "Doe",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      location: "New York, NY"
    },
    photographer_profiles: {
      specialties: ["Wedding", "Portrait", "Engagement"]
    }
  },
  {
    id: "sample-service-2",
    title: "Engagement Session",
    description: "Romantic engagement photoshoot at location of your choice. Perfect for save-the-dates. Includes 50+ edited photos.",
    price: 450,
    duration_hours: 2,
    is_active: true,
    photographer_id: "sample-user-1",
    profiles: {
      first_name: "John",
      last_name: "Doe",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      location: "New York, NY"
    },
    photographer_profiles: {
      specialties: ["Wedding", "Portrait", "Engagement"]
    }
  },
  {
    id: "sample-service-3",
    title: "Corporate Event Coverage",
    description: "Professional documentation of your corporate event, conference, or business gathering. Full event coverage.",
    price: 800,
    duration_hours: 4,
    is_active: true,
    photographer_id: "sample-user-2",
    profiles: {
      first_name: "Sarah",
      last_name: "Smith",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      location: "Los Angeles, CA"
    },
    photographer_profiles: {
      specialties: ["Event", "Corporate", "Concert"]
    }
  },
  {
    id: "sample-service-4",
    title: "Adventure Engagement Session",
    description: "Outdoor adventure engagement shoot in stunning natural locations for adventurous couples.",
    price: 650,
    duration_hours: 3,
    is_active: true,
    photographer_id: "sample-user-3",
    profiles: {
      first_name: "Mike",
      last_name: "Johnson",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      location: "Denver, CO"
    },
    photographer_profiles: {
      specialties: ["Nature", "Adventure", "Engagement"]
    }
  },
  {
    id: "sample-service-5",
    title: "Fashion Portfolio Shoot",
    description: "Professional fashion photography for models, actors, and influencers. Studio or location options.",
    price: 750,
    duration_hours: 3,
    is_active: true,
    photographer_id: "sample-user-4",
    profiles: {
      first_name: "Emma",
      last_name: "Wilson",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      location: "Miami, FL"
    },
    photographer_profiles: {
      specialties: ["Fashion", "Commercial", "Beauty"]
    }
  },
  {
    id: "sample-service-6",
    title: "Family Portrait Session",
    description: "Natural, candid family photography session. Multiple outfit changes and locations included.",
    price: 400,
    duration_hours: 2,
    is_active: true,
    photographer_id: "sample-user-5",
    profiles: {
      first_name: "David",
      last_name: "Brown",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
      location: "Chicago, IL"
    },
    photographer_profiles: {
      specialties: ["Documentary", "Street", "Family"]
    }
  },
  {
    id: "sample-service-7",
    title: "Brand Photography Session",
    description: "Commercial photography for businesses, products, and marketing materials with multiple setups.",
    price: 950,
    duration_hours: 4,
    is_active: true,
    photographer_id: "sample-user-4",
    profiles: {
      first_name: "Emma",
      last_name: "Wilson",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      location: "Miami, FL"
    },
    photographer_profiles: {
      specialties: ["Fashion", "Commercial", "Beauty"]
    }
  },
  {
    id: "sample-service-8",
    title: "Concert Photography",
    description: "High-energy concert and music event photography. Experienced with low-light environments.",
    price: 600,
    duration_hours: 4,
    is_active: true,
    photographer_id: "sample-user-2",
    profiles: {
      first_name: "Sarah",
      last_name: "Smith",
      avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      location: "Los Angeles, CA"
    },
    photographer_profiles: {
      specialties: ["Event", "Corporate", "Concert"]
    }
  }
];

export const sampleReviews: Record<string, SampleReview[]> = {
  "sample-user-1": [
    { id: "r1", rating: 5, comment: "John captured our wedding beautifully! Every photo tells a story.", created_at: "2024-12-15T10:00:00Z", reviewer_id: "rev1", is_public: true, reviewer_profile: { first_name: "Emily", last_name: "Davis", avatar_url: "" } },
    { id: "r2", rating: 5, comment: "Professional, creative, and so easy to work with. Highly recommend!", created_at: "2024-11-20T10:00:00Z", reviewer_id: "rev2", is_public: true, reviewer_profile: { first_name: "Michael", last_name: "Brown", avatar_url: "" } }
  ],
  "sample-user-2": [
    { id: "r3", rating: 5, comment: "Sarah's event coverage was amazing! She captured every important moment.", created_at: "2024-12-01T10:00:00Z", reviewer_id: "rev3", is_public: true, reviewer_profile: { first_name: "Lisa", last_name: "Wang", avatar_url: "" } }
  ],
  "sample-user-3": [
    { id: "r4", rating: 5, comment: "Mike's adventure shoot was incredible! The mountain backdrop was perfect.", created_at: "2024-11-15T10:00:00Z", reviewer_id: "rev4", is_public: true, reviewer_profile: { first_name: "John", last_name: "Smith", avatar_url: "" } }
  ],
  "sample-user-4": [
    { id: "r5", rating: 5, comment: "Emma's fashion shots are stunning. Perfect for my portfolio!", created_at: "2024-12-10T10:00:00Z", reviewer_id: "rev5", is_public: true, reviewer_profile: { first_name: "Maria", last_name: "Garcia", avatar_url: "" } }
  ],
  "sample-user-5": [
    { id: "r6", rating: 5, comment: "David made our family feel so comfortable. Amazing candid shots!", created_at: "2024-11-25T10:00:00Z", reviewer_id: "rev6", is_public: true, reviewer_profile: { first_name: "Robert", last_name: "Johnson", avatar_url: "" } }
  ]
};

// Helper to get photographer by user_id
export const getSamplePhotographerByUserId = (userId: string) => {
  return samplePhotographers.find(p => p.user_id === userId);
};

// Helper to get services by photographer user_id
export const getSampleServicesByPhotographerId = (photographerId: string) => {
  return sampleServices.filter(s => s.photographer_id === photographerId);
};

// Helper to get reviews by photographer user_id
export const getSampleReviewsByPhotographerId = (photographerId: string) => {
  return sampleReviews[photographerId] || [];
};
