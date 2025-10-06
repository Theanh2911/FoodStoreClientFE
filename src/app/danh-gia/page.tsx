"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, MessageSquare, Send, CheckCircle } from "lucide-react";

export default function DanhGiaPage() {
  const [rating, setRating] = React.useState<number>(0);
  const [hoverRating, setHoverRating] = React.useState<number>(0);
  const [reviewText, setReviewText] = React.useState<string>("");
  const [showThankYouModal, setShowThankYouModal] = React.useState(false);

  // Handle star click
  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  // Handle star hover
  const handleStarHover = (starValue: number) => {
    setHoverRating(starValue);
  };

  // Handle mouse leave from stars
  const handleStarsLeave = () => {
    setHoverRating(0);
  };

  // Handle submit review
  const handleSubmitReview = () => {
    if (rating === 0) {
      alert("Vui lòng chọn số sao đánh giá!");
      return;
    }

    // Here you can add API call to submit the review
    console.log('Review submitted:', {
      rating,
      comment: reviewText,
      timestamp: new Date().toISOString()
    });

    // Show thank you modal
    setShowThankYouModal(true);
  };

  // Handle modal close and reset form
  const handleModalClose = () => {
    setShowThankYouModal(false);
    setRating(0);
    setReviewText("");
  };

  // Get star display value (hover takes precedence over rating)
  const displayRating = hoverRating || rating;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Đánh giá
            </h1>
            <p className="text-gray-600">
              Chia sẻ trải nghiệm của bạn về dịch vụ
            </p>
          </div>
        </div>

        {/* Rating Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Nhận xét của bạn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Đánh giá chất lượng dịch vụ
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      className="focus:outline-none transition-colors duration-150"
                      onClick={() => handleStarClick(starValue)}
                      onMouseEnter={() => handleStarHover(starValue)}
                      onMouseLeave={handleStarsLeave}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          starValue <= displayRating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        } transition-colors duration-150`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-sm text-gray-600">
                    {rating === 0 
                      ? "Chưa chọn" 
                      : `${rating} sao${rating > 1 ? "" : ""}`
                    }
                  </span>
                </div>
                
                {/* Rating descriptions */}
                <div className="mt-2">
                  {rating > 0 && (
                    <p className="text-sm text-gray-600">
                      {rating === 1 && "Rất không hài lòng"}
                      {rating === 2 && "Không hài lòng"}
                      {rating === 3 && "Bình thường"}
                      {rating === 4 && "Hài lòng"}
                      {rating === 5 && "Rất hài lòng"}
                    </p>
                  )}
                </div>
              </div>

              {/* Comment Text Box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhận xét chi tiết (tùy chọn)
                </label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về chất lượng món ăn, dịch vụ, không gian..."
                  className="min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    Góp ý của bạn sẽ giúp chúng tôi cải thiện dịch vụ
                  </p>
                  <span className="text-xs text-gray-400">
                    {reviewText.length}/500
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSubmitReview}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Gửi nhận xét
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Thank You Modal */}
      <Dialog open={showThankYouModal} onOpenChange={setShowThankYouModal}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-xl">
              Cảm ơn đã đánh giá!
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Nhận xét của bạn đã được ghi nhận. Chúng tôi sẽ sử dụng góp ý này để cải thiện chất lượng dịch vụ.
            </p>
            
            <div className="flex items-center justify-center space-x-1 mb-4">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <Star
                  key={starValue}
                  className={`h-5 w-5 ${
                    starValue <= rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating} sao
              </span>
            </div>

            <Button
              onClick={handleModalClose}
              className="bg-green-600 hover:bg-green-700"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


